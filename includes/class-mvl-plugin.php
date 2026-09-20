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
		add_action( 'edit_form_after_title', array( self::class, 'render_content_cta' ) );
		add_action( 'admin_enqueue_scripts', array( self::class, 'enqueue_admin_assets' ) );
		add_filter( 'admin_body_class', array( self::class, 'filter_admin_body_class' ) );
		add_action( 'rest_api_init', array( self::class, 'register_routes' ) );
		add_action( 'wp_enqueue_scripts', array( self::class, 'enqueue_preview_assets' ) );
		add_action( 'wp', array( self::class, 'maybe_disable_wpautop' ) );
		add_action( 'plugins_loaded', array( self::class, 'maybe_disable_admin_bar' ) );
	}

	/**
	 * La vista previa del maquetador carga la página real en un iframe; si el usuario
	 * tiene la sesión abierta, WordPress le mete su barra de admin encima del diseño.
	 * El filtro show_admin_bar hay que registrarlo antes de que corra _wp_admin_bar_init
	 * (enganchado a 'init'), así que se hace en plugins_loaded.
	 */
	public static function maybe_disable_admin_bar(): void {
		if ( isset( $_GET['mvl_preview'] ) && '1' === $_GET['mvl_preview'] ) {
			add_filter( 'show_admin_bar', '__return_false' );
		}
	}

	/**
	 * El HTML que genera el maquetador ya trae su propio wpautop() por bloque de texto;
	 * si se deja el wpautop global de WordPress, envuelve los saltos de línea entre
	 * secciones en <p>/<br> sueltos y descuadra el layout.
	 */
	public static function maybe_disable_wpautop(): void {
		$post = get_post();
		if ( is_singular() && $post instanceof WP_Post && str_contains( $post->post_content, '<!-- mvl:document' ) ) {
			remove_filter( 'the_content', 'wpautop' );
		}
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

	/**
	 * Cuando una página ya está maquetada, su post_content es el HTML/CSS generado
	 * por el builder (con el JSON del layout en un comentario). Editarlo a mano desde
	 * el editor de WordPress puede romper ese JSON, así que se muestra un botón bien
	 * visible, justo encima del editor de contenido, para volver siempre al maquetador.
	 */
	public static function render_content_cta( WP_Post $post ): void {
		if ( ! in_array( $post->post_type, array( 'page', 'post' ), true ) || ! current_user_can( 'edit_post', $post->ID ) ) {
			return;
		}
		if ( ! str_contains( $post->post_content, '<!-- mvl:document' ) ) {
			return;
		}
		$url = add_query_arg( array( 'page' => 'mvl-builder', 'post_id' => $post->ID ), admin_url( 'admin.php' ) );
		echo '<div class="mvl-content-cta">'
			. '<p>' . esc_html__( 'Esta página está maquetada con el Maquetador Visual Ligero. Para no romper el diseño, editala siempre desde ahí.', 'maquetador-visual-ligero' ) . '</p>'
			. '<a class="button button-primary button-hero" href="' . esc_url( $url ) . '">' . esc_html__( 'Editar con el Maquetador Visual', 'maquetador-visual-ligero' ) . '</a>'
			. '</div>'
			. '<style>.mvl-content-cta{margin:20px 0;padding:20px;background:#fff;border:1px solid #dcdcde;border-left:4px solid #2271b1;border-radius:2px}.mvl-content-cta p{margin-top:0;font-size:14px}</style>';
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
		wp_enqueue_media();
		wp_enqueue_style( 'mvl-builder', plugins_url( 'assets/builder.css', self::$plugin_file ), array( 'dashicons' ), '0.1.0' );
		wp_enqueue_script( 'mvl-builder', plugins_url( 'assets/builder.js', self::$plugin_file ), array( 'media-editor' ), '0.1.0', true );
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
	'background' => self::sanitize_responsive( $settings['background'] ?? null, array( self::class, 'sanitize_background_value' ), array( 'type' => 'color', 'color' => '#ffffff' ) ),
					'tag'        => in_array( $settings['tag'] ?? '', array( 'div', 'section', 'article' ), true ) ? $settings['tag'] : 'section',
					'textAlign'  => self::sanitize_responsive( $settings['textAlign'] ?? null, array( self::class, 'sanitize_text_align' ), 'left' ),
					'gap'        => self::sanitize_responsive( $settings['gap'] ?? null, static function ( $v ) { return self::sanitize_spacing_side( $v, '16px' ); }, '16px' ),
					'flexDirection'  => self::sanitize_responsive( $settings['flexDirection'] ?? null, array( self::class, 'sanitize_flex_direction' ), 'column' ),
					'justifyContent' => self::sanitize_responsive( $settings['justifyContent'] ?? null, array( self::class, 'sanitize_justify_content' ), 'flex-start' ),
					'alignItems'     => self::sanitize_responsive( $settings['alignItems'] ?? null, array( self::class, 'sanitize_align_items' ), 'stretch' ),
					'padding'    => self::sanitize_responsive( $settings['padding'] ?? null, static function ( $v ) { return self::sanitize_spacing( $v, array( 'top' => '48px', 'right' => '24px', 'bottom' => '48px', 'left' => '24px' ) ); }, array( 'top' => '48px', 'right' => '24px', 'bottom' => '48px', 'left' => '24px' ) ),
					'margin'     => self::sanitize_responsive( $settings['margin'] ?? null, static function ( $v ) { return self::sanitize_spacing( $v, array( 'top' => '0px', 'right' => '0px', 'bottom' => '0px', 'left' => '0px' ) ); }, array( 'top' => '0px', 'right' => '0px', 'bottom' => '0px', 'left' => '0px' ) ),
				),
				'children' => $items,
			);
		}
		return $sections;
	}

	private static function sanitize_item( array $item ): array {
		$type     = $item['type'];
		$data     = is_array( $item['data'] ?? null ) ? $item['data'] : array();
		$settings = is_array( $item['settings'] ?? null ) ? $item['settings'] : array();
		$clean    = array(
			'id'       => sanitize_key( $item['id'] ?? wp_generate_uuid4() ),
			'type'     => $type,
			'data'     => array(),
			'settings' => array(
				'background' => self::sanitize_responsive( $settings['background'] ?? null, array( self::class, 'sanitize_background_value' ), array( 'type' => 'none' ) ),
				'padding'    => self::sanitize_responsive( $settings['padding'] ?? null, static function ( $v ) { return self::sanitize_spacing( $v, array( 'top' => '0px', 'right' => '0px', 'bottom' => '0px', 'left' => '0px' ) ); }, array( 'top' => '0px', 'right' => '0px', 'bottom' => '0px', 'left' => '0px' ) ),
				'margin'     => self::sanitize_responsive( $settings['margin'] ?? null, static function ( $v ) { return self::sanitize_spacing( $v, array( 'top' => '0px', 'right' => '0px', 'bottom' => '0px', 'left' => '0px' ) ); }, array( 'top' => '0px', 'right' => '0px', 'bottom' => '0px', 'left' => '0px' ) ),
			),
		);
		if ( 'heading' === $type ) { $clean['data'] = array( 'text' => sanitize_text_field( $data['text'] ?? '' ), 'level' => in_array( (int) ( $data['level'] ?? 2 ), array( 1, 2, 3, 4, 5, 6 ), true ) ? (int) $data['level'] : 2 ); }
		if ( 'text' === $type ) { $clean['data'] = array( 'text' => wp_kses_post( $data['text'] ?? '' ) ); }
		if ( 'button' === $type ) { $clean['data'] = array( 'text' => sanitize_text_field( $data['text'] ?? '' ), 'url' => esc_url_raw( $data['url'] ?? '' ) ); }
		if ( 'image' === $type ) { $clean['data'] = array( 'url' => esc_url_raw( $data['url'] ?? '' ), 'alt' => sanitize_text_field( $data['alt'] ?? '' ), 'id' => absint( $data['id'] ?? 0 ), 'size' => sanitize_key( $data['size'] ?? 'full' ) ); }
		return $clean;
	}

	private static function sanitize_color( $color ): string {
		$color = sanitize_hex_color( (string) $color );
		return $color ?: '#ffffff';
	}

	private static function sanitize_text_align( $value ): string {
		return in_array( $value, array( 'left', 'center', 'right' ), true ) ? $value : 'left';
	}

	private static function sanitize_flex_direction( $value ): string {
		return in_array( $value, array( 'row', 'column' ), true ) ? $value : 'column';
	}

	private static function sanitize_justify_content( $value ): string {
		return in_array( $value, array( 'flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly' ), true ) ? $value : 'flex-start';
	}

	private static function sanitize_align_items( $value ): string {
		return in_array( $value, array( 'stretch', 'flex-start', 'center', 'flex-end' ), true ) ? $value : 'stretch';
	}

	/**
	 * Un lado de padding/margin admite cualquier unidad CSS (px, %, em, rem, vh, vw),
	 * no solo píxeles; los valores numéricos planos (formato antiguo) se asumen en px.
	 */
	private static function sanitize_spacing_side( $value, string $default ): string {
		if ( is_numeric( $value ) ) {
			return self::format_spacing_number( (float) $value ) . 'px';
		}
		if ( is_string( $value ) && preg_match( '/^(-?\d+(?:\.\d+)?)(px|%|em|rem|vh|vw)$/', trim( $value ), $matches ) ) {
			return self::format_spacing_number( (float) $matches[1] ) . $matches[2];
		}
		return $default;
	}

	private static function format_spacing_number( float $num ): string {
		$num = max( -1000, min( 1000, $num ) );
		$str = rtrim( rtrim( number_format( $num, 3, '.', '' ), '0' ), '.' );
		return '' !== $str ? $str : '0';
	}

	private static function sanitize_spacing( $value, array $default ): array {
		if ( is_numeric( $value ) || ( is_string( $value ) && preg_match( '/^-?\d+(?:\.\d+)?(px|%|em|rem|vh|vw)$/', trim( $value ) ) ) ) {
			$value = array( 'top' => $value, 'bottom' => $value );
		}
		$value  = is_array( $value ) ? $value : array();
		$result = array();
		foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
			$result[ $side ] = self::sanitize_spacing_side( $value[ $side ] ?? null, $default[ $side ] );
		}
		$result['linked'] = ! empty( $value['linked'] );
		return $result;
	}

	private static function sanitize_bg_image( $value ): array {
		$value = is_array( $value ) ? $value : array();
		return array(
			'url'      => esc_url_raw( $value['url'] ?? '' ),
			'size'     => in_array( $value['size'] ?? '', array( 'cover', 'contain', 'auto' ), true ) ? $value['size'] : 'cover',
			'position' => sanitize_text_field( $value['position'] ?? 'center center' ),
			'repeat'   => in_array( $value['repeat'] ?? '', array( 'no-repeat', 'repeat' ), true ) ? $value['repeat'] : 'no-repeat',
		);
	}

	private static function sanitize_gradient( $value ): array {
		$value     = is_array( $value ) ? $value : array();
		$type      = in_array( $value['type'] ?? '', array( 'linear', 'radial' ), true ) ? $value['type'] : 'linear';
		$angle     = isset( $value['angle'] ) ? max( 0, min( 360, (int) $value['angle'] ) ) : 180;
		$stops_raw = is_array( $value['stops'] ?? null ) ? array_slice( $value['stops'], 0, 6 ) : array();
		$stops     = array();
		foreach ( $stops_raw as $stop ) {
			if ( ! is_array( $stop ) ) {
				continue;
			}
			$stops[] = array(
				'color' => self::sanitize_color( $stop['color'] ?? '#ffffff' ),
				'pos'   => max( 0, min( 100, (int) ( $stop['pos'] ?? 0 ) ) ),
			);
		}
		if ( count( $stops ) < 2 ) {
			$stops = array( array( 'color' => '#ff0000', 'pos' => 0 ), array( 'color' => '#0000ff', 'pos' => 100 ) );
		}
		return array( 'type' => $type, 'angle' => $angle, 'stops' => $stops );
	}

	private static function sanitize_bg_video( $value ): array {
		$value = is_array( $value ) ? $value : array();
		return array( 'url' => esc_url_raw( $value['url'] ?? '' ) );
	}

	private static function sanitize_background_value( $value ): array {
		if ( is_string( $value ) ) {
			// Compatibilidad con el formato antiguo, donde el fondo era un color plano.
			$value = array( 'type' => 'color', 'color' => $value );
		}
		$value = is_array( $value ) ? $value : array();
		$type  = in_array( $value['type'] ?? '', array( 'none', 'color', 'image', 'gradient', 'video' ), true ) ? $value['type'] : 'none';
		return array(
			'type'     => $type,
			'color'    => self::sanitize_color( $value['color'] ?? '#ffffff' ),
			'image'    => self::sanitize_bg_image( $value['image'] ?? null ),
			'gradient' => self::sanitize_gradient( $value['gradient'] ?? null ),
			'video'    => self::sanitize_bg_video( $value['video'] ?? null ),
		);
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

	private static function spacing_css( array $spacing ): string {
		return esc_attr( $spacing['top'] ) . ' ' . esc_attr( $spacing['right'] ) . ' ' . esc_attr( $spacing['bottom'] ) . ' ' . esc_attr( $spacing['left'] );
	}

	private static function background_css( array $bg ): string {
		if ( 'color' === $bg['type'] ) {
			return 'background:' . esc_attr( $bg['color'] ) . ';';
		}
		if ( 'image' === $bg['type'] && $bg['image']['url'] ) {
			return 'background-image:url(' . esc_url( $bg['image']['url'] ) . ');background-size:' . esc_attr( $bg['image']['size'] ) . ';background-position:' . esc_attr( $bg['image']['position'] ) . ';background-repeat:' . esc_attr( $bg['image']['repeat'] ) . ';';
		}
		if ( 'gradient' === $bg['type'] ) {
			$stops = array_map( static function ( $stop ) { return esc_attr( $stop['color'] ) . ' ' . (int) $stop['pos'] . '%'; }, $bg['gradient']['stops'] );
			$fn    = 'radial' === $bg['gradient']['type'] ? 'radial-gradient(circle, ' : 'linear-gradient(' . (int) $bg['gradient']['angle'] . 'deg, ';
			return 'background:' . $fn . implode( ', ', $stops ) . ');';
		}
		return '';
	}

	private static function has_video_bg( array $settings ): bool {
		return 'video' === $settings['background']['desktop']['type'] && '' !== $settings['background']['desktop']['video']['url'];
	}

	private static function bg_video_html( array $settings ): string {
		return '<div class="mvl-bg-video"><video autoplay muted loop playsinline src="' . esc_url( $settings['background']['desktop']['video']['url'] ) . '"></video></div>';
	}

	/**
	 * Construye las reglas CSS (base/tablet/mobile) de fondo + padding + margin
	 * para un selector [data-mvl-uid], compartido entre secciones e items.
	 *
	 * @return array{0:string,1:string,2:string}
	 */
	private static function build_style_block( string $selector, array $settings ): array {
		$base   = $selector . '{' . self::background_css( $settings['background']['desktop'] ) . 'padding:' . self::spacing_css( $settings['padding']['desktop'] ) . '!important;margin:' . self::spacing_css( $settings['margin']['desktop'] ) . '!important;}';
		$tablet = '';
		$mobile = '';
		foreach ( array( 'tablet', 'mobile' ) as $device ) {
			$bg   = $settings['background'][ $device ];
			$pad  = $settings['padding'][ $device ];
			$mar  = $settings['margin'][ $device ];
			if ( null === $bg && null === $pad && null === $mar ) {
				continue;
			}
			$decl = '';
			if ( null !== $bg ) {
				$decl .= self::background_css( $bg );
			}
			if ( null !== $pad ) {
				$decl .= 'padding:' . self::spacing_css( $pad ) . '!important;';
			}
			if ( null !== $mar ) {
				$decl .= 'margin:' . self::spacing_css( $mar ) . '!important;';
			}
			if ( ! $decl ) {
				continue;
			}
			$rule = $selector . '{' . $decl . '}';
			if ( 'tablet' === $device ) {
				$tablet .= $rule;
			} else {
				$mobile .= $rule;
			}
		}
		return array( $base, $tablet, $mobile );
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
			list( $base, $tablet, $mobile ) = self::build_style_block( '[data-mvl-uid="' . $uid . '"]', $settings );
			$base_rules   .= $base;
			$tablet_rules .= $tablet;
			$mobile_rules .= $mobile;
			$base_rules   .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{text-align:' . esc_attr( $settings['textAlign']['desktop'] ) . ';gap:' . esc_attr( $settings['gap']['desktop'] ) . ';flex-direction:' . esc_attr( $settings['flexDirection']['desktop'] ) . ';justify-content:' . esc_attr( $settings['justifyContent']['desktop'] ) . ';align-items:' . esc_attr( $settings['alignItems']['desktop'] ) . '}';
			if ( null !== $settings['textAlign']['tablet'] ) {
				$tablet_rules .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{text-align:' . esc_attr( $settings['textAlign']['tablet'] ) . '}';
			}
			if ( null !== $settings['textAlign']['mobile'] ) {
				$mobile_rules .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{text-align:' . esc_attr( $settings['textAlign']['mobile'] ) . '}';
			}
			if ( null !== $settings['gap']['tablet'] ) {
				$tablet_rules .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{gap:' . esc_attr( $settings['gap']['tablet'] ) . '}';
			}
			if ( null !== $settings['gap']['mobile'] ) {
				$mobile_rules .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{gap:' . esc_attr( $settings['gap']['mobile'] ) . '}';
			}
			if ( null !== $settings['flexDirection']['tablet'] ) {
				$tablet_rules .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{flex-direction:' . esc_attr( $settings['flexDirection']['tablet'] ) . '}';
			}
			if ( null !== $settings['flexDirection']['mobile'] ) {
				$mobile_rules .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{flex-direction:' . esc_attr( $settings['flexDirection']['mobile'] ) . '}';
			}
			if ( null !== $settings['justifyContent']['tablet'] ) {
				$tablet_rules .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{justify-content:' . esc_attr( $settings['justifyContent']['tablet'] ) . '}';
			}
			if ( null !== $settings['justifyContent']['mobile'] ) {
				$mobile_rules .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{justify-content:' . esc_attr( $settings['justifyContent']['mobile'] ) . '}';
			}
			if ( null !== $settings['alignItems']['tablet'] ) {
				$tablet_rules .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{align-items:' . esc_attr( $settings['alignItems']['tablet'] ) . '}';
			}
			if ( null !== $settings['alignItems']['mobile'] ) {
				$mobile_rules .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{align-items:' . esc_attr( $settings['alignItems']['mobile'] ) . '}';
			}
			foreach ( $section['children'] as $item ) {
				list( $ibase, $itablet, $imobile ) = self::build_style_block( '[data-mvl-uid="' . esc_attr( $item['id'] ) . '"]', $item['settings'] );
				$base_rules   .= $ibase;
				$tablet_rules .= $itablet;
				$mobile_rules .= $imobile;
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
			$section_has_video = self::has_video_bg( $section['settings'] );
			$container_tag     = in_array( $section['settings']['tag'] ?? '', array( 'div', 'section', 'article' ), true ) ? $section['settings']['tag'] : 'section';
			$html .= '<!-- mvl:section ' . self::json_for_comment( array( 'uid' => $section['id'], 'settings' => $section['settings'] ) ) . ' -->' . "\n";
			$html .= '<' . $container_tag . ' class="mvl-section mvl-bg-host' . ( $section_has_video ? ' mvl-has-video-bg' : '' ) . '" data-mvl-uid="' . esc_attr( $section['id'] ) . '">';
			if ( $section_has_video ) {
				$html .= self::bg_video_html( $section['settings'] );
			}
			$html .= '<div class="mvl-container" style="max-width:1140px;margin:0 auto">';
			foreach ( $section['children'] as $item ) {
				$data         = $item['data'];
				$item_settings = $item['settings'];
				$item_has_video = self::has_video_bg( $item_settings );
				$attr = ' data-mvl-uid="' . esc_attr( $item['id'] ) . '"';
				$html .= '<!-- mvl:' . esc_html( $item['type'] ) . ' ' . self::json_for_comment( array_merge( array( 'uid' => $item['id'], 'settings' => $item_settings ), $data ) ) . ' -->' . "\n";
				$html .= '<div class="mvl-item mvl-item-' . esc_attr( $item['type'] ) . ' mvl-bg-host' . ( $item_has_video ? ' mvl-has-video-bg' : '' ) . '"' . $attr . '>';
				if ( $item_has_video ) {
					$html .= self::bg_video_html( $item_settings );
				}
				if ( 'heading' === $item['type'] ) { $tag = 'h' . (int) $data['level']; $html .= '<' . $tag . ' class="mvl-heading">' . esc_html( $data['text'] ) . '</' . $tag . '>'; }
				if ( 'text' === $item['type'] ) { $html .= '<div class="mvl-text">' . wpautop( wp_kses_post( $data['text'] ) ) . '</div>'; }
				if ( 'button' === $item['type'] ) { $html .= '<p><a class="mvl-button" href="' . esc_url( $data['url'] ) . '">' . esc_html( $data['text'] ) . '</a></p>'; }
				if ( 'image' === $item['type'] && $data['url'] ) { $html .= '<img class="mvl-image" src="' . esc_url( $data['url'] ) . '" alt="' . esc_attr( $data['alt'] ) . '">'; }
				$html .= '</div>' . "\n<!-- /mvl:" . esc_html( $item['type'] ) . " -->\n";
			}
			$html .= '</div></' . $container_tag . '>' . "\n<!-- /mvl:section -->\n";
		}
		return $html . '</div>';
	}

	public static function enqueue_preview_assets(): void {
		$is_preview = isset( $_GET['mvl_preview'] ) && '1' === $_GET['mvl_preview'];
		if ( ! $is_preview && ! ( is_singular() && str_contains( get_post()->post_content ?? '', '<!-- mvl:document' ) ) ) {
			return;
		}
		wp_enqueue_style( 'mvl-preview', plugins_url( 'assets/preview.css', self::$plugin_file ), array(), '0.1.0' );
		wp_enqueue_script( 'mvl-preview', plugins_url( 'assets/preview.js', self::$plugin_file ), array(), '0.1.0', true );
	}
}
