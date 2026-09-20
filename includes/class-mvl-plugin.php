<?php
/**
 * Plugin principal del Maquetador Visual Ligero.
 */

declare( strict_types=1 );

final class MVL_Plugin {
	private static string $plugin_file;

	public static function init( string $plugin_file ): void {
		self::$plugin_file = $plugin_file;
		add_action( 'admin_menu', array( self::class, 'add_builder_page' ) );
		add_action( 'add_meta_boxes', array( self::class, 'add_builder_link' ), 10, 2 );
		add_action( 'admin_enqueue_scripts', array( self::class, 'enqueue_admin_assets' ) );
		add_filter( 'admin_body_class', array( self::class, 'filter_admin_body_class' ) );
		add_action( 'rest_api_init', array( self::class, 'register_routes' ) );
		add_action( 'wp_enqueue_scripts', array( self::class, 'enqueue_preview_assets' ) );
	}

	public static function add_builder_page(): void {
		add_menu_page( 'Maquetador visual', 'Maquetador visual', 'edit_pages', 'mvl-builder', array( self::class, 'render_builder_page' ), 'dashicons-layout', 30 );
	}

	public static function add_builder_link( string $post_type, WP_Post $post ): void {
		if ( ! in_array( $post_type, array( 'page', 'post' ), true ) || ! current_user_can( 'edit_post', $post->ID ) ) {
			return;
		}
		add_meta_box( 'mvl-open-builder', 'Maquetador visual', array( self::class, 'render_builder_link' ), $post_type, 'side', 'high', array( 'post_id' => $post->ID ) );
	}

	public static function render_builder_link( WP_Post $post, array $box ): void {
		$url = add_query_arg( array( 'page' => 'mvl-builder', 'post_id' => (int) $box['args']['post_id'] ), admin_url( 'admin.php' ) );
		echo '<p>Diseña esta página en una vista que usa el tema real.</p><p><a class="button button-primary" href="' . esc_url( $url ) . '">Abrir maquetador</a></p>';
	}

	public static function filter_admin_body_class( string $classes ): string {
		if ( isset( $_GET['page'] ) && 'mvl-builder' === $_GET['page'] ) {
			$classes .= ' mvl-fullscreen';
		}
		return $classes;
	}

	public static function render_builder_page(): void {
		$post_id = isset( $_GET['post_id'] ) ? absint( wp_unslash( $_GET['post_id'] ) ) : 0;
		$post    = get_post( $post_id );
		if ( ! $post || ! in_array( $post->post_type, array( 'page', 'post' ), true ) || ! current_user_can( 'edit_post', $post_id ) ) {
			wp_die( esc_html__( 'No tienes permiso para editar este contenido.', 'maquetador-visual-ligero' ) );
		}
		echo '<div class="wrap mvl-admin-wrap"><div id="mvl-builder"></div></div>';
	}

	public static function enqueue_admin_assets( string $hook ): void {
		if ( 'toplevel_page_mvl-builder' !== $hook ) {
			return;
		}
		$post_id = isset( $_GET['post_id'] ) ? absint( wp_unslash( $_GET['post_id'] ) ) : 0;
		if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		wp_enqueue_style( 'mvl-builder', plugins_url( 'assets/builder.css', self::$plugin_file ), array(), '0.1.0' );
		wp_enqueue_script( 'mvl-builder', plugins_url( 'assets/builder.js', self::$plugin_file ), array(), '0.1.0', true );
		wp_add_inline_script( 'mvl-builder', 'window.MVL = ' . wp_json_encode( array(
			'postId'     => $post_id,
			'restUrl'    => esc_url_raw( rest_url( 'mvl/v1/layout/' . $post_id ) ),
			'nonce'      => wp_create_nonce( 'wp_rest' ),
			'layout'     => self::get_layout( $post_id ),
			'previewUrl' => add_query_arg( 'mvl_preview', '1', get_permalink( $post_id ) ),
			'postTitle'  => get_the_title( $post_id ),
		) ) . ';', 'before' );
	}

	public static function register_routes(): void {
		register_rest_route( 'mvl/v1', '/layout/(?P<id>\\d+)', array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( self::class, 'get_layout_route' ),
				'permission_callback' => array( self::class, 'can_edit_layout' ),
			),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( self::class, 'save_layout_route' ),
				'permission_callback' => array( self::class, 'can_edit_layout' ),
				'args'                => array( 'layout' => array( 'required' => true, 'type' => 'array' ) ),
			),
		) );
	}

	public static function can_edit_layout( WP_REST_Request $request ): bool {
		return current_user_can( 'edit_post', (int) $request['id'] );
	}

	public static function get_layout_route( WP_REST_Request $request ): WP_REST_Response {
		return rest_ensure_response( array( 'layout' => self::get_layout( (int) $request['id'] ) ) );
	}

	public static function save_layout_route( WP_REST_Request $request ): WP_REST_Response {
		$post_id = (int) $request['id'];
		$layout  = self::sanitize_layout( $request->get_param( 'layout' ) );
		$result  = wp_update_post( array( 'ID' => $post_id, 'post_content' => self::serialize_layout( $layout ) ), true );
		if ( is_wp_error( $result ) ) {
			return new WP_REST_Response( array( 'message' => $result->get_error_message() ), 500 );
		}
		return rest_ensure_response( array( 'layout' => $layout, 'saved' => true ) );
	}

	private static function get_layout( int $post_id ): array {
		$post = get_post( $post_id );
		if ( ! $post || ! preg_match( '/<!--\\s*mvl:document\\s+(.+?)\\s*-->/s', $post->post_content, $matches ) ) {
			return array();
		}
		$document = json_decode( html_entity_decode( $matches[1], ENT_QUOTES, get_bloginfo( 'charset' ) ), true );
		return is_array( $document['layout'] ?? null ) ? self::sanitize_layout( $document['layout'] ) : array();
	}

	private static function sanitize_layout( $layout ): array {
		if ( ! is_array( $layout ) ) {
			return array();
		}
		$sections = array();
		foreach ( array_slice( $layout, 0, 30 ) as $section ) {
			if ( ! is_array( $section ) || 'section' !== ( $section['type'] ?? '' ) ) {
				continue;
			}
			$settings = is_array( $section['settings'] ?? null ) ? $section['settings'] : array();
			$items    = array();
			foreach ( array_slice( is_array( $section['children'] ?? null ) ? $section['children'] : array(), 0, 50 ) as $item ) {
				if ( ! is_array( $item ) || ! in_array( $item['type'] ?? '', array( 'heading', 'text', 'button', 'image' ), true ) ) {
					continue;
				}
				$items[] = self::sanitize_item( $item );
			}
			$sections[] = array(
				'id'       => sanitize_key( $section['id'] ?? wp_generate_uuid4() ),
				'type'     => 'section',
				'settings' => array(
					'background' => self::sanitize_responsive( $settings['background'] ?? null, array( self::class, 'sanitize_color' ), '#ffffff' ),
					'textAlign'  => self::sanitize_responsive( $settings['textAlign'] ?? null, array( self::class, 'sanitize_text_align' ), 'left' ),
					'padding'    => self::sanitize_responsive( $settings['padding'] ?? null, array( self::class, 'sanitize_padding' ), array( 'top' => 48, 'right' => 24, 'bottom' => 48, 'left' => 24 ) ),
				),
				'children' => $items,
			);
		}
		return $sections;
	}

	private static function sanitize_item( array $item ): array {
		$type = $item['type'];
		$data = is_array( $item['data'] ?? null ) ? $item['data'] : array();
		$clean = array( 'id' => sanitize_key( $item['id'] ?? wp_generate_uuid4() ), 'type' => $type, 'data' => array() );
		if ( 'heading' === $type ) { $clean['data'] = array( 'text' => sanitize_text_field( $data['text'] ?? '' ), 'level' => in_array( (int) ( $data['level'] ?? 2 ), array( 1, 2, 3, 4, 5, 6 ), true ) ? (int) $data['level'] : 2 ); }
		if ( 'text' === $type ) { $clean['data'] = array( 'text' => wp_kses_post( $data['text'] ?? '' ) ); }
		if ( 'button' === $type ) { $clean['data'] = array( 'text' => sanitize_text_field( $data['text'] ?? '' ), 'url' => esc_url_raw( $data['url'] ?? '' ) ); }
		if ( 'image' === $type ) { $clean['data'] = array( 'url' => esc_url_raw( $data['url'] ?? '' ), 'alt' => sanitize_text_field( $data['alt'] ?? '' ) ); }
		return $clean;
	}

	private static function sanitize_color( $color ): string {
		$color = sanitize_hex_color( (string) $color );
		return $color ?: '#ffffff';
	}

	private static function sanitize_text_align( $value ): string {
		return in_array( $value, array( 'left', 'center', 'right' ), true ) ? $value : 'left';
	}

	private static function sanitize_padding( $value ): array {
		$default = array( 'top' => 48, 'right' => 24, 'bottom' => 48, 'left' => 24 );
		if ( is_numeric( $value ) ) {
			// Compatibilidad con el antiguo "espaciado vertical" único.
			$value = array( 'top' => $value, 'bottom' => $value );
		}
		$value = is_array( $value ) ? $value : array();
		$result = array();
		foreach ( $default as $side => $fallback ) {
			$result[ $side ] = min( 160, absint( $value[ $side ] ?? $fallback ) );
		}
		return $result;
	}

	/**
	 * Normaliza un valor de ajuste a la forma responsive {desktop, tablet, mobile},
	 * aceptando también el formato antiguo (valor plano) para compatibilidad.
	 */
	private static function sanitize_responsive( $raw, callable $sanitizer, $default ) {
		if ( is_array( $raw ) && array_key_exists( 'desktop', $raw ) ) {
			return array(
				'desktop' => call_user_func( $sanitizer, $raw['desktop'] ?? $default ),
				'tablet'  => isset( $raw['tablet'] ) && null !== $raw['tablet'] ? call_user_func( $sanitizer, $raw['tablet'] ) : null,
				'mobile'  => isset( $raw['mobile'] ) && null !== $raw['mobile'] ? call_user_func( $sanitizer, $raw['mobile'] ) : null,
			);
		}
		return array(
			'desktop' => call_user_func( $sanitizer, null !== $raw ? $raw : $default ),
			'tablet'  => null,
			'mobile'  => null,
		);
	}

	private static function padding_css( array $padding ): string {
		return absint( $padding['top'] ) . 'px ' . absint( $padding['right'] ) . 'px ' . absint( $padding['bottom'] ) . 'px ' . absint( $padding['left'] ) . 'px';
	}

	private static function serialize_layout( array $layout ): string {
		$document = '<!-- mvl:document ' . self::json_for_comment( array( 'version' => 1, 'layout' => $layout ) ) . ' -->' . "\n";
		return $document . self::render_layout( $layout );
	}

	private static function json_for_comment( array $data ): string {
		return wp_json_encode( $data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
	}

	private static function render_layout( array $layout ): string {
		$base_rules   = '';
		$tablet_rules = '';
		$mobile_rules = '';
		foreach ( $layout as $section ) {
			$uid      = esc_attr( $section['id'] );
			$settings = $section['settings'];
			$base_rules .= '[data-mvl-uid="' . $uid . '"]{background:' . esc_attr( $settings['background']['desktop'] ) . ';padding:' . self::padding_css( $settings['padding']['desktop'] ) . '}';
			$base_rules .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{text-align:' . esc_attr( $settings['textAlign']['desktop'] ) . '}';
			if ( null !== $settings['background']['tablet'] || null !== $settings['padding']['tablet'] || null !== $settings['textAlign']['tablet'] ) {
				if ( null !== $settings['background']['tablet'] || null !== $settings['padding']['tablet'] ) {
					$tablet_rules .= '[data-mvl-uid="' . $uid . '"]{' . ( null !== $settings['background']['tablet'] ? 'background:' . esc_attr( $settings['background']['tablet'] ) . ';' : '' ) . ( null !== $settings['padding']['tablet'] ? 'padding:' . self::padding_css( $settings['padding']['tablet'] ) . ';' : '' ) . '}';
				}
				if ( null !== $settings['textAlign']['tablet'] ) {
					$tablet_rules .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{text-align:' . esc_attr( $settings['textAlign']['tablet'] ) . '}';
				}
			}
			if ( null !== $settings['background']['mobile'] || null !== $settings['padding']['mobile'] || null !== $settings['textAlign']['mobile'] ) {
				if ( null !== $settings['background']['mobile'] || null !== $settings['padding']['mobile'] ) {
					$mobile_rules .= '[data-mvl-uid="' . $uid . '"]{' . ( null !== $settings['background']['mobile'] ? 'background:' . esc_attr( $settings['background']['mobile'] ) . ';' : '' ) . ( null !== $settings['padding']['mobile'] ? 'padding:' . self::padding_css( $settings['padding']['mobile'] ) . ';' : '' ) . '}';
				}
				if ( null !== $settings['textAlign']['mobile'] ) {
					$mobile_rules .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{text-align:' . esc_attr( $settings['textAlign']['mobile'] ) . '}';
				}
			}
		}
		$style = '<style>' . $base_rules;
		if ( $tablet_rules ) {
			$style .= '@media (max-width:1024px){' . $tablet_rules . '}';
		}
		if ( $mobile_rules ) {
			$style .= '@media (max-width:767px){' . $mobile_rules . '}';
		}
		$style .= '</style>';

		$html = $style . '<div class="mvl-layout">';
		foreach ( $layout as $section ) {
			$section_data = array( 'uid' => $section['id'], 'background' => $section['settings']['background'], 'padding' => $section['settings']['padding'], 'textAlign' => $section['settings']['textAlign'] );
			$html .= '<!-- mvl:section ' . self::json_for_comment( $section_data ) . ' -->' . "\n";
			$html .= '<section class="mvl-section" data-mvl-uid="' . esc_attr( $section['id'] ) . '"><div class="mvl-container" style="max-width:1140px;margin:0 auto">';
			foreach ( $section['children'] as $item ) {
				$data = $item['data'];
				$attr = ' data-mvl-uid="' . esc_attr( $item['id'] ) . '"';
				$html .= '<!-- mvl:' . esc_html( $item['type'] ) . ' ' . self::json_for_comment( array_merge( array( 'uid' => $item['id'] ), $data ) ) . ' -->' . "\n";
				if ( 'heading' === $item['type'] ) { $tag = 'h' . (int) $data['level']; $html .= '<' . $tag . ' class="mvl-heading"' . $attr . '>' . esc_html( $data['text'] ) . '</' . $tag . '>'; }
				if ( 'text' === $item['type'] ) { $html .= '<div class="mvl-text"' . $attr . '>' . wpautop( wp_kses_post( $data['text'] ) ) . '</div>'; }
				if ( 'button' === $item['type'] ) { $html .= '<p' . $attr . '><a class="mvl-button" style="display:inline-block;padding:12px 20px;background:#135e96;color:#fff;border-radius:3px;text-decoration:none" href="' . esc_url( $data['url'] ) . '">' . esc_html( $data['text'] ) . '</a></p>'; }
				if ( 'image' === $item['type'] && $data['url'] ) { $html .= '<img class="mvl-image" style="display:block;max-width:100%;height:auto"' . $attr . ' src="' . esc_url( $data['url'] ) . '" alt="' . esc_attr( $data['alt'] ) . '">'; }
				$html .= "\n<!-- /mvl:" . esc_html( $item['type'] ) . " -->\n";
			}
			$html .= '</div></section>' . "\n<!-- /mvl:section -->\n";
		}
		return $html . '</div>';
	}

	public static function enqueue_preview_assets(): void {
		if ( ! isset( $_GET['mvl_preview'] ) || '1' !== $_GET['mvl_preview'] ) {
			return;
		}
		wp_enqueue_style( 'mvl-preview', plugins_url( 'assets/preview.css', self::$plugin_file ), array(), '0.1.0' );
		wp_enqueue_script( 'mvl-preview', plugins_url( 'assets/preview.js', self::$plugin_file ), array(), '0.1.0', true );
	}
}
