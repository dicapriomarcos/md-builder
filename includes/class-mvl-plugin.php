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

	/**
	 * Usa la fecha de modificación del archivo como versión del asset, para que el
	 * navegador invalide el caché automáticamente en cada cambio (con una versión
	 * fija, un simple guardado no alcanzaba para ver los cambios sin forzar recarga).
	 */
	private static function asset_version( string $relative_path ): string {
		$path = plugin_dir_path( self::$plugin_file ) . $relative_path;
		$mtime = file_exists( $path ) ? filemtime( $path ) : false;
		return $mtime ? (string) $mtime : '0.1.0';
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
		wp_enqueue_style( 'mvl-builder', plugins_url( 'assets/builder.css', self::$plugin_file ), array( 'dashicons' ), self::asset_version( 'assets/builder.css' ) );
		wp_enqueue_script( 'mvl-builder', plugins_url( 'assets/builder.js', self::$plugin_file ), array( 'media-editor' ), self::asset_version( 'assets/builder.js' ), true );
		$linkable_post_types = array();
		foreach ( self::linkable_post_types() as $slug => $label ) {
			$linkable_post_types[] = array( 'slug' => $slug, 'label' => $label );
		}
		wp_add_inline_script( 'mvl-builder', 'window.MVL = ' . wp_json_encode( array(
			'postId'            => $post_id,
			'restUrl'           => esc_url_raw( rest_url( 'mvl/v1/layout/' . $post_id ) ),
			'variablesUrl'      => esc_url_raw( rest_url( 'mvl/v1/variables' ) ),
			'restRoot'          => esc_url_raw( rest_url() ),
			'nonce'             => wp_create_nonce( 'wp_rest' ),
			'layout'            => self::get_layout( $post_id ),
			'variables'         => self::get_variables(),
			'fontCatalog'       => self::google_fonts_catalog(),
			'maxRegisteredFonts' => self::MAX_REGISTERED_FONTS,
			'previewUrl'        => add_query_arg( 'mvl_preview', '1', get_permalink( $post_id ) ),
			'postTitle'         => get_the_title( $post_id ),
			'dynamicPreview'    => self::dynamic_tag_values( $post_id ),
			'linkablePostTypes' => $linkable_post_types,
		) ) . ';', 'before' );
	}

	/**
	 * Etiquetas de contenido dinámico admitidas para el botón (al estilo de los
	 * "Dynamic Tags" de Elementor): en vez de escribir el texto/URL a mano, se elige
	 * una de estas y se resuelve contra el post real. Se resuelven en el momento de
	 * guardar (el HTML final queda "horneado" en post_content, como el resto del
	 * layout), no en cada visita — si el título de la página cambia, hay que volver
	 * a guardar el maquetador para que el botón lo refleje.
	 */
	private const TEXT_DYNAMIC_TAGS = array( '', 'post_title', 'site_title', 'author_name', 'current_date' );
	private const URL_DYNAMIC_TAGS  = array( '', 'post_url', 'site_url', 'author_url', 'featured_image' );

	/**
	 * Además de las etiquetas fijas de arriba, la URL admite una por cada tipo de
	 * contenido público con vista individual del sitio: "post_link_page",
	 * "post_link_post", "post_link_<cpt>"... (al estilo del selector "Post/Page"
	 * de Elementor, pero uno por tipo en vez de uno genérico). Se valida contra
	 * los post types REALMENTE registrados en este sitio en el momento de guardar,
	 * así que un JSON con un tipo que no existe (o ya no existe) cae a estático.
	 */
	private static function linkable_post_types(): array {
		$types = array();
		foreach ( get_post_types( array( 'public' => true ), 'objects' ) as $post_type ) {
			if ( 'attachment' === $post_type->name || ! is_post_type_viewable( $post_type ) ) {
				continue;
			}
			$types[ $post_type->name ] = $post_type->labels->singular_name;
		}
		$ordered = array();
		foreach ( array( 'page', 'post' ) as $priority ) {
			if ( isset( $types[ $priority ] ) ) {
				$ordered[ $priority ] = $types[ $priority ];
				unset( $types[ $priority ] );
			}
		}
		return $ordered + $types;
	}

	private static function is_valid_url_tag( string $tag ): bool {
		if ( in_array( $tag, self::URL_DYNAMIC_TAGS, true ) ) {
			return true;
		}
		return str_starts_with( $tag, 'post_link_' ) && array_key_exists( substr( $tag, strlen( 'post_link_' ) ), self::linkable_post_types() );
	}

	private static function dynamic_tag_values( int $post_id ): array {
		$values = array();
		foreach ( array_diff( self::TEXT_DYNAMIC_TAGS, array( '' ) ) as $tag ) {
			$values[ $tag ] = self::resolve_dynamic_text( $tag, $post_id );
		}
		foreach ( array_diff( self::URL_DYNAMIC_TAGS, array( '' ) ) as $tag ) {
			$values[ $tag ] = self::resolve_dynamic_url( $tag, $post_id );
		}
		return $values;
	}

	private static function resolve_dynamic_text( string $tag, int $post_id ): string {
		switch ( $tag ) {
			case 'post_title':
				return get_the_title( $post_id );
			case 'site_title':
				return get_bloginfo( 'name' );
			case 'author_name':
				return get_the_author_meta( 'display_name', (int) get_post_field( 'post_author', $post_id ) );
			case 'current_date':
				return date_i18n( get_option( 'date_format' ) );
			default:
				return '';
		}
	}

	private static function resolve_dynamic_url( string $tag, int $post_id, array $data = array() ): string {
		if ( str_starts_with( $tag, 'post_link_' ) ) {
			$target_id = absint( $data['urlPostId'] ?? 0 );
			$permalink = $target_id ? get_permalink( $target_id ) : false;
			return $permalink ? (string) $permalink : '';
		}
		switch ( $tag ) {
			case 'post_url':
				return (string) get_permalink( $post_id );
			case 'site_url':
				return home_url( '/' );
			case 'author_url':
				return (string) get_author_posts_url( (int) get_post_field( 'post_author', $post_id ) );
			case 'featured_image':
				return (string) ( get_the_post_thumbnail_url( $post_id, 'full' ) ?: '' );
			default:
				return '';
		}
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
		register_rest_route( 'mvl/v1', '/variables', array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( self::class, 'get_variables_route' ),
				'permission_callback' => array( self::class, 'can_manage_variables' ),
			),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( self::class, 'save_variables_route' ),
				'permission_callback' => array( self::class, 'can_manage_variables' ),
				'args'                => array( 'variables' => array( 'required' => true, 'type' => 'object' ) ),
			),
		) );
	}

	public static function can_edit_layout( WP_REST_Request $request ): bool {
		return current_user_can( 'edit_post', (int) $request['id'] );
	}

	/**
	 * Las "Variables" (tipografía global, fuentes registradas, estilos de botón) son
	 * de sitio entero, no de un post concreto, así que se piden con el mismo permiso
	 * que abre el maquetador en general en vez de "edit_post" de un ID puntual.
	 */
	public static function can_manage_variables(): bool {
		return current_user_can( 'edit_pages' );
	}

	public static function get_variables_route(): WP_REST_Response {
		return rest_ensure_response( array( 'variables' => self::get_variables() ) );
	}

	public static function save_variables_route( WP_REST_Request $request ): WP_REST_Response {
		$variables = self::sanitize_variables( $request->get_param( 'variables' ) );
		update_option( 'mvl_variables', $variables, false );
		$font_errors = self::sync_local_fonts( $variables );
		return rest_ensure_response( array( 'variables' => $variables, 'saved' => true, 'fontErrors' => $font_errors ) );
	}

	public static function get_layout_route( WP_REST_Request $request ): WP_REST_Response {
		return rest_ensure_response( array( 'layout' => self::get_layout( (int) $request['id'] ) ) );
	}

	/**
	 * Roles tipográficos globales que se pueden fijar desde "Variables": los 6
	 * niveles de título semánticos más un rol genérico de párrafo (que se aplica a
	 * los bloques de texto). No son responsive en esta primera versión: un único
	 * valor por rol para todos los tamaños de pantalla.
	 */
	private const TYPOGRAPHY_ROLES = array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'paragraph' );
	/** "Estilo" combina peso + cursiva en una sola opción, como los "variants" de Google Fonts. */
	private const FONT_VARIANTS    = array( 'regular', 'italic', 'bold', 'bolditalic' );
	private const TEXT_TRANSFORMS  = array( 'none', 'uppercase', 'lowercase', 'capitalize' );
	/** Máximo de familias de Google Fonts que se pueden registrar (y por lo tanto descargar localmente). */
	private const MAX_REGISTERED_FONTS = 6;
	/** Máximo de estilos de botón con nombre guardables en Variables. */
	private const MAX_BUTTON_STYLES = 12;

	/**
	 * Catálogo curado de familias de Google Fonts para el selector del maquetador:
	 * no es el catálogo completo de Google Fonts (que tiene miles de familias), es
	 * una selección representativa para no tener que depender de una API key de
	 * Google en el servidor. Las primeras son las más usadas habitualmente; el resto
	 * va en orden alfabético. sanitize_registered_fonts() valida contra esta lista,
	 * así que una familia que no esté aquí no se puede registrar ni descargar.
	 */
	private static function google_fonts_catalog(): array {
		$popular = array(
			'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Source Sans Pro', 'Oswald', 'Raleway',
			'Noto Sans', 'Merriweather', 'Ubuntu', 'PT Sans', 'Roboto Condensed', 'Nunito', 'Playfair Display',
			'Rubik', 'Work Sans', 'Mulish', 'Inter', 'Roboto Slab', 'Karla', 'Quicksand', 'Nunito Sans',
			'Fira Sans', 'Barlow', 'DM Sans', 'Josefin Sans', 'Titillium Web', 'Manrope', 'Cabin',
			'Libre Baskerville', 'Bitter', 'Dosis', 'Hind', 'Arimo', 'Heebo', 'IBM Plex Sans', 'Space Grotesk',
			'Crimson Text', 'Anton',
		);
		$rest = array(
			'Abel', 'Acme', 'Alegreya', 'Archivo', 'Archivo Narrow', 'Arvo', 'Asap', 'Assistant', 'Bai Jamjuree',
			'Baloo 2', 'Bebas Neue', 'BioRhyme', 'Cairo', 'Catamaran', 'Caveat', 'Chivo', 'Comfortaa', 'Cormorant',
			'Cousine', 'Crete Round', 'Cuprum', 'Dancing Script', 'Domine', 'EB Garamond', 'Eczar', 'Exo', 'Exo 2',
			'Fira Code', 'Fjalla One', 'Frank Ruhl Libre', 'Gelasio', 'Georama', 'Gothic A1', 'Great Vibes',
			'Handlee', 'Hepta Slab', 'IBM Plex Mono', 'IBM Plex Serif', 'Inconsolata', 'Indie Flower', 'Inder',
			'Jost', 'Kalam', 'Kanit', 'Khand', 'Libre Franklin', 'Lobster', 'Lora', 'M PLUS Rounded 1c',
			'Maven Pro', 'Merriweather Sans', 'Montserrat Alternates', 'Mukta', 'Noticia Text', 'Noto Serif',
			'Numans', 'Old Standard TT', 'Oxygen', 'Pacifico', 'Padauk', 'Pathway Gothic One', 'Petrona',
			'PT Serif', 'Playfair Display SC', 'Poiret One', 'Prata', 'Public Sans', 'Questrial', 'Quattrocento',
			'Righteous', 'Roboto Mono', 'Rokkitt', 'Rufina', 'Sacramento', 'Sarabun', 'Satisfy', 'Secular One',
			'Shadows Into Light', 'Signika', 'Slabo 27px', 'Sora', 'Spectral', 'Staatliches', 'Suez One', 'Tajawal',
			'Teko', 'Tenor Sans', 'Tinos', 'Urbanist', 'Varela Round', 'Vidaloka', 'Vollkorn', 'Yanone Kaffeesatz',
			'Yantramanav', 'Zilla Slab',
		);
		sort( $rest );
		return array_values( array_unique( array_merge( $popular, $rest ) ) );
	}

	private static function get_variables(): array {
		$stored = get_option( 'mvl_variables', array() );
		return self::sanitize_variables( is_array( $stored ) ? $stored : array() );
	}

	private static function sanitize_variables( $raw ): array {
		$raw        = is_array( $raw ) ? $raw : array();
		$fonts_raw  = is_array( $raw['fonts'] ?? null ) ? $raw['fonts'] : array();
		$registered      = self::sanitize_registered_fonts( $fonts_raw['registered'] ?? array() );
		$typography_raw  = is_array( $fonts_raw['typography'] ?? null ) ? $fonts_raw['typography'] : array();
		$typography      = array();
		foreach ( self::TYPOGRAPHY_ROLES as $role ) {
			$typography[ $role ] = self::sanitize_typography( $typography_raw[ $role ] ?? null, $registered );
		}
		return array(
			'containerMaxWidth' => self::sanitize_spacing_side( $raw['containerMaxWidth'] ?? null, '1140px' ),
			'fonts'             => array(
				'registered' => $registered,
				'typography' => $typography,
			),
			'buttonStyles'      => self::sanitize_button_styles( $raw['buttonStyles'] ?? array(), $registered ),
		);
	}

	private static function sanitize_registered_fonts( $value ): array {
		$catalog = self::google_fonts_catalog();
		$result  = array();
		foreach ( array_slice( is_array( $value ) ? $value : array(), 0, self::MAX_REGISTERED_FONTS ) as $family ) {
			$family = sanitize_text_field( (string) $family );
			if ( '' !== $family && in_array( $family, $catalog, true ) && ! in_array( $family, $result, true ) ) {
				$result[] = $family;
			}
		}
		return $result;
	}

	/**
	 * Se usa tanto para los 7 roles globales (h1-h6/párrafo) como para el override
	 * opcional de un bloque individual y para la tipografía de un estilo de botón:
	 * misma forma en los tres sitios. "family" vacío o fuera de $registered = "sin
	 * anular, hereda del tema/rol global"; igual con "size" vacío.
	 */
	private static function sanitize_typography( $value, array $registered ): array {
		$value  = is_array( $value ) ? $value : array();
		$family = sanitize_text_field( (string) ( $value['family'] ?? '' ) );
		if ( '' !== $family && ! in_array( $family, $registered, true ) ) {
			$family = '';
		}
		return array(
			'family'    => $family,
			'size'      => self::sanitize_spacing_side( $value['size'] ?? '', '' ),
			'variant'   => in_array( $value['variant'] ?? '', self::FONT_VARIANTS, true ) ? $value['variant'] : 'regular',
			'transform' => in_array( $value['transform'] ?? '', self::TEXT_TRANSFORMS, true ) ? $value['transform'] : 'none',
		);
	}

	/**
	 * Lista de clases CSS separadas por espacio en un único input de texto (p.ej.
	 * "clase1 clase2"): se valida token por token y se descartan caracteres que no
	 * sean válidos en un nombre de clase CSS.
	 */
	private static function sanitize_css_classes( $value ): string {
		$value  = is_string( $value ) ? $value : '';
		$tokens = preg_split( '/\s+/', trim( $value ) );
		$clean  = array();
		foreach ( (array) $tokens as $token ) {
			$token = preg_replace( '/[^A-Za-z0-9_-]/', '', $token );
			if ( '' !== $token ) {
				$clean[] = $token;
			}
		}
		return implode( ' ', array_slice( array_unique( $clean ), 0, 20 ) );
	}

	private static function sanitize_html_id( $value ): string {
		$value = is_string( $value ) ? trim( $value ) : '';
		$value = preg_replace( '/[^A-Za-z0-9_-]/', '', $value );
		if ( '' !== $value && ! preg_match( '/^[A-Za-z]/', $value ) ) {
			$value = '';
		}
		return substr( $value, 0, 64 );
	}

	private static function sanitize_button_styles( $value, array $registered ): array {
		$result = array();
		$ids    = array();
		foreach ( array_slice( is_array( $value ) ? $value : array(), 0, self::MAX_BUTTON_STYLES ) as $style ) {
			if ( ! is_array( $style ) ) {
				continue;
			}
			$id = sanitize_key( $style['id'] ?? wp_generate_uuid4() );
			if ( '' === $id || in_array( $id, $ids, true ) ) {
				$id = sanitize_key( wp_generate_uuid4() );
			}
			$ids[]    = $id;
			$result[] = array(
				'id'         => $id,
				'name'       => sanitize_text_field( $style['name'] ?? '' ) ?: 'Estilo sin nombre',
				'background' => self::sanitize_button_style_background( $style['background'] ?? null ),
				'textColor'  => self::sanitize_color( $style['textColor'] ?? '#ffffff' ),
				'border'     => self::sanitize_border( $style['border'] ?? null ),
				'padding'    => self::sanitize_spacing( $style['padding'] ?? null, array( 'top' => '12px', 'right' => '24px', 'bottom' => '12px', 'left' => '24px' ) ),
				'typography' => self::sanitize_typography( $style['typography'] ?? null, $registered ),
			);
		}
		return $result;
	}

	private static function sanitize_button_style_background( $value ): array {
		$value = is_array( $value ) ? $value : array();
		return array(
			'type'  => in_array( $value['type'] ?? '', array( 'none', 'color' ), true ) ? $value['type'] : 'color',
			'color' => self::sanitize_color( $value['color'] ?? '#2271b1' ),
		);
	}

	public static function save_layout_route( WP_REST_Request $request ): WP_REST_Response {
		$post_id = (int) $request['id'];
		$layout  = self::sanitize_layout( $request->get_param( 'layout' ) );
		$result  = wp_update_post( array( 'ID' => $post_id, 'post_content' => self::serialize_layout( $layout, $post_id ) ), true );
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

	/** Cuántos niveles de contenedores anidados se permiten (0 = solo raíz). */
	private const MAX_NESTING_DEPTH = 4;

	private static function sanitize_layout( $layout ): array {
		$variables = self::get_variables();
		$sections  = array();
		foreach ( array_slice( is_array( $layout ) ? $layout : array(), 0, 30 ) as $section ) {
			if ( is_array( $section ) && 'section' === ( $section['type'] ?? '' ) ) {
				$sections[] = self::sanitize_section( $section, 0, $variables );
			}
		}
		return $sections;
	}

	/**
	 * Los hijos de un contenedor pueden ser otros contenedores (anidados, hasta
	 * MAX_NESTING_DEPTH niveles) o bloques de contenido (heading/text/button/image).
	 */
	private static function sanitize_children( array $children, int $depth, array $variables ): array {
		$result = array();
		foreach ( array_slice( $children, 0, 50 ) as $node ) {
			if ( ! is_array( $node ) ) {
				continue;
			}
			$type = $node['type'] ?? '';
			if ( 'section' === $type ) {
				if ( $depth < self::MAX_NESTING_DEPTH ) {
					$result[] = self::sanitize_section( $node, $depth, $variables );
				}
			} elseif ( in_array( $type, array( 'heading', 'text', 'button', 'image' ), true ) ) {
				$result[] = self::sanitize_item( $node, $variables );
			}
		}
		return $result;
	}

	private static function sanitize_section( array $section, int $depth, array $variables ): array {
		$settings = is_array( $section['settings'] ?? null ) ? $section['settings'] : array();
		return array(
			'id'       => sanitize_key( $section['id'] ?? wp_generate_uuid4() ),
			'type'     => 'section',
			'settings' => array(
				'background'     => self::sanitize_responsive( $settings['background'] ?? null, array( self::class, 'sanitize_background_value' ), array( 'type' => 'color', 'color' => '#ffffff' ) ),
				'border'         => self::sanitize_responsive( $settings['border'] ?? null, array( self::class, 'sanitize_border' ), array() ),
				'tag'            => in_array( $settings['tag'] ?? '', array( 'div', 'section', 'article' ), true ) ? $settings['tag'] : 'section',
				'classes'        => self::sanitize_css_classes( $settings['classes'] ?? '' ),
				'htmlId'         => self::sanitize_html_id( $settings['htmlId'] ?? '' ),
				'display'        => in_array( $settings['display'] ?? '', array( 'flex', 'grid' ), true ) ? $settings['display'] : 'flex',
				'columns'        => self::sanitize_responsive( $settings['columns'] ?? null, static function ( $v ) { return max( 1, min( 12, (int) $v ) ); }, 3 ),
				'textAlign'      => self::sanitize_responsive( $settings['textAlign'] ?? null, array( self::class, 'sanitize_text_align' ), 'left' ),
				'gap'            => self::sanitize_responsive( $settings['gap'] ?? null, static function ( $v ) { return self::sanitize_spacing_side( $v, '16px' ); }, '16px' ),
				'flexDirection'  => self::sanitize_responsive( $settings['flexDirection'] ?? null, array( self::class, 'sanitize_flex_direction' ), 'column' ),
				'justifyContent' => self::sanitize_responsive( $settings['justifyContent'] ?? null, array( self::class, 'sanitize_justify_content' ), 'flex-start' ),
				'alignItems'     => self::sanitize_responsive( $settings['alignItems'] ?? null, array( self::class, 'sanitize_align_items' ), 'stretch' ),
				'padding'        => self::sanitize_responsive( $settings['padding'] ?? null, static function ( $v ) { return self::sanitize_spacing( $v, array( 'top' => '48px', 'right' => '24px', 'bottom' => '48px', 'left' => '24px' ) ); }, array( 'top' => '48px', 'right' => '24px', 'bottom' => '48px', 'left' => '24px' ) ),
				'margin'         => self::sanitize_responsive( $settings['margin'] ?? null, static function ( $v ) { return self::sanitize_spacing( $v, array( 'top' => '0px', 'right' => '0px', 'bottom' => '0px', 'left' => '0px' ) ); }, array( 'top' => '0px', 'right' => '0px', 'bottom' => '0px', 'left' => '0px' ) ),
			),
			'children' => self::sanitize_children( is_array( $section['children'] ?? null ) ? $section['children'] : array(), $depth + 1, $variables ),
		);
	}

	private static function sanitize_item( array $item, array $variables ): array {
		$type     = $item['type'];
		$data     = is_array( $item['data'] ?? null ) ? $item['data'] : array();
		$settings = is_array( $item['settings'] ?? null ) ? $item['settings'] : array();
		$clean    = array(
			'id'       => sanitize_key( $item['id'] ?? wp_generate_uuid4() ),
			'type'     => $type,
			'data'     => array(),
			'settings' => array(
				'background' => self::sanitize_responsive( $settings['background'] ?? null, array( self::class, 'sanitize_background_value' ), array( 'type' => 'none' ) ),
				'border'     => self::sanitize_responsive( $settings['border'] ?? null, array( self::class, 'sanitize_border' ), array() ),
				'padding'    => self::sanitize_responsive( $settings['padding'] ?? null, static function ( $v ) { return self::sanitize_spacing( $v, array( 'top' => '0px', 'right' => '0px', 'bottom' => '0px', 'left' => '0px' ) ); }, array( 'top' => '0px', 'right' => '0px', 'bottom' => '0px', 'left' => '0px' ) ),
				'margin'     => self::sanitize_responsive( $settings['margin'] ?? null, static function ( $v ) { return self::sanitize_spacing( $v, array( 'top' => '0px', 'right' => '0px', 'bottom' => '0px', 'left' => '0px' ) ); }, array( 'top' => '0px', 'right' => '0px', 'bottom' => '0px', 'left' => '0px' ) ),
				'classes'    => self::sanitize_css_classes( $settings['classes'] ?? '' ),
				'htmlId'     => self::sanitize_html_id( $settings['htmlId'] ?? '' ),
				'typography' => self::sanitize_typography( $settings['typography'] ?? null, $variables['fonts']['registered'] ),
			),
		);
		if ( 'heading' === $type ) { $clean['data'] = array( 'text' => sanitize_text_field( $data['text'] ?? '' ), 'level' => in_array( (int) ( $data['level'] ?? 2 ), array( 1, 2, 3, 4, 5, 6 ), true ) ? (int) $data['level'] : 2 ); }
		if ( 'text' === $type ) { $clean['data'] = array( 'text' => wp_kses_post( $data['text'] ?? '' ) ); }
		if ( 'button' === $type ) {
			$button_style_ids = wp_list_pluck( $variables['buttonStyles'], 'id' );
			$clean['data']    = array(
				'text'        => sanitize_text_field( $data['text'] ?? '' ),
				'textTag'     => in_array( $data['textTag'] ?? '', self::TEXT_DYNAMIC_TAGS, true ) ? $data['textTag'] : '',
				'url'         => esc_url_raw( $data['url'] ?? '' ),
				'urlTag'      => self::is_valid_url_tag( (string) ( $data['urlTag'] ?? '' ) ) ? $data['urlTag'] : '',
				'urlPostId'   => absint( $data['urlPostId'] ?? 0 ),
				'buttonStyle' => in_array( $data['buttonStyle'] ?? '', $button_style_ids, true ) ? $data['buttonStyle'] : '',
			);
		}
		if ( 'image' === $type ) { $clean['data'] = array( 'url' => esc_url_raw( $data['url'] ?? '' ), 'alt' => sanitize_text_field( $data['alt'] ?? '' ), 'id' => absint( $data['id'] ?? 0 ), 'size' => sanitize_key( $data['size'] ?? 'full' ) ); }
		return $clean;
	}

	private static function sanitize_border( $value ): array {
		$value = is_array( $value ) ? $value : array();
		return array(
			'style'  => in_array( $value['style'] ?? '', array( 'none', 'solid', 'dashed', 'dotted' ), true ) ? $value['style'] : 'none',
			'width'  => self::sanitize_spacing_side( $value['width'] ?? null, '1px' ),
			'color'  => self::sanitize_color( $value['color'] ?? '#000000' ),
			'radius' => self::sanitize_spacing_side( $value['radius'] ?? null, '0px' ),
		);
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

	private static function border_css( array $border ): string {
		$css = 'border-radius:' . esc_attr( $border['radius'] ) . ';';
		if ( 'none' !== $border['style'] ) {
			$css .= 'border:' . esc_attr( $border['width'] ) . ' ' . esc_attr( $border['style'] ) . ' ' . esc_attr( $border['color'] ) . ';';
		} else {
			$css .= 'border:none;';
		}
		return $css;
	}

	/** Traduce el "Estilo" (peso+cursiva combinados, como los variants de Google Fonts) a font-weight/font-style. */
	private static function variant_css( string $variant ): string {
		switch ( $variant ) {
			case 'italic':
				return 'font-style:italic!important;font-weight:400!important;';
			case 'bold':
				return 'font-style:normal!important;font-weight:700!important;';
			case 'bolditalic':
				return 'font-style:italic!important;font-weight:700!important;';
			default:
				return 'font-style:normal!important;font-weight:400!important;';
		}
	}

	/**
	 * CSS de un bloque de tipografía (rol global h1-h6/párrafo, override de un
	 * bloque, o tipografía de un estilo de botón): cada campo vacío/"regular"/"none"
	 * significa "no anular", así que solo se emite lo que el usuario cambió de
	 * verdad. Cada declaración lleva su propio !important (no uno solo al final del
	 * bloque, que sería CSS inválido) porque compite con el CSS del tema — esa es la
	 * idea: dejar de depender del tema para la tipografía, ver spec §8.3.
	 */
	private static function typography_css( string $selector, array $typo ): string {
		$decl = '';
		if ( '' !== $typo['family'] ) {
			$decl .= 'font-family:"' . esc_attr( $typo['family'] ) . '",sans-serif!important;';
		}
		if ( '' !== $typo['size'] ) {
			$decl .= 'font-size:' . esc_attr( $typo['size'] ) . '!important;';
		}
		if ( 'regular' !== $typo['variant'] ) {
			$decl .= self::variant_css( $typo['variant'] );
		}
		if ( 'none' !== $typo['transform'] ) {
			$decl .= 'text-transform:' . esc_attr( $typo['transform'] ) . '!important;';
		}
		return $decl ? $selector . '{' . $decl . '}' : '';
	}

	/** Selector del elemento de texto real dentro de un Item, para aplicarle tipografía (no el div .mvl-item que lo envuelve). */
	private static function item_typography_selector( string $uid, string $type ): string {
		switch ( $type ) {
			case 'heading':
				return '[data-mvl-uid="' . $uid . '"] .mvl-heading';
			case 'text':
				return '[data-mvl-uid="' . $uid . '"] .mvl-text';
			case 'button':
				return '[data-mvl-uid="' . $uid . '"] .mvl-button';
			default:
				return '';
		}
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
		$base   = $selector . '{' . self::background_css( $settings['background']['desktop'] ) . self::border_css( $settings['border']['desktop'] ) . 'padding:' . self::spacing_css( $settings['padding']['desktop'] ) . '!important;margin:' . self::spacing_css( $settings['margin']['desktop'] ) . '!important;}';
		$tablet = '';
		$mobile = '';
		foreach ( array( 'tablet', 'mobile' ) as $device ) {
			$bg   = $settings['background'][ $device ];
			$bd   = $settings['border'][ $device ];
			$pad  = $settings['padding'][ $device ];
			$mar  = $settings['margin'][ $device ];
			if ( null === $bg && null === $bd && null === $pad && null === $mar ) {
				continue;
			}
			$decl = '';
			if ( null !== $bg ) {
				$decl .= self::background_css( $bg );
			}
			if ( null !== $bd ) {
				$decl .= self::border_css( $bd );
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

	private static function serialize_layout( array $layout, int $post_id ): string {
		$document = '<!-- mvl:document ' . self::json_for_comment( array( 'version' => 1, 'layout' => $layout ) ) . ' -->' . "\n";
		return $document . self::render_layout( $layout, $post_id );
	}

	private static function json_for_comment( array $data ): string {
		return wp_json_encode( $data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
	}

	/**
	 * Recorre recursivamente secciones e items (un contenedor puede tener otros
	 * contenedores anidados como hijos) juntando las reglas CSS base/tablet/mobile
	 * de cada uno en $rules, por referencia.
	 */
	private static function collect_style_rules( array $nodes, array &$rules ): void {
		foreach ( $nodes as $node ) {
			$uid = esc_attr( $node['id'] );
			list( $base, $tablet, $mobile ) = self::build_style_block( '[data-mvl-uid="' . $uid . '"]', $node['settings'] );
			$rules['base']   .= $base;
			$rules['tablet'] .= $tablet;
			$rules['mobile'] .= $mobile;
			$typo_selector = self::item_typography_selector( $uid, $node['type'] );
			if ( '' !== $typo_selector && isset( $node['settings']['typography'] ) ) {
				$rules['base'] .= self::typography_css( $typo_selector, $node['settings']['typography'] );
			}
			if ( 'section' === $node['type'] ) {
				$settings   = $node['settings'];
				$is_grid    = 'grid' === $settings['display'];
				$grid_decl  = $is_grid ? 'display:grid;grid-template-columns:repeat(' . (int) $settings['columns']['desktop'] . ',1fr);' : 'display:flex;flex-wrap:wrap;flex-direction:' . esc_attr( $settings['flexDirection']['desktop'] ) . ';justify-content:' . esc_attr( $settings['justifyContent']['desktop'] ) . ';align-items:' . esc_attr( $settings['alignItems']['desktop'] ) . ';';
				$rules['base'] .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{text-align:' . esc_attr( $settings['textAlign']['desktop'] ) . ';gap:' . esc_attr( $settings['gap']['desktop'] ) . ';' . $grid_decl . '}';
				if ( null !== $settings['textAlign']['tablet'] ) {
					$rules['tablet'] .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{text-align:' . esc_attr( $settings['textAlign']['tablet'] ) . '}';
				}
				if ( null !== $settings['textAlign']['mobile'] ) {
					$rules['mobile'] .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{text-align:' . esc_attr( $settings['textAlign']['mobile'] ) . '}';
				}
				if ( null !== $settings['gap']['tablet'] ) {
					$rules['tablet'] .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{gap:' . esc_attr( $settings['gap']['tablet'] ) . '}';
				}
				if ( null !== $settings['gap']['mobile'] ) {
					$rules['mobile'] .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{gap:' . esc_attr( $settings['gap']['mobile'] ) . '}';
				}
				if ( $is_grid ) {
					if ( null !== $settings['columns']['tablet'] ) {
						$rules['tablet'] .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{grid-template-columns:repeat(' . (int) $settings['columns']['tablet'] . ',1fr)}';
					}
					if ( null !== $settings['columns']['mobile'] ) {
						$rules['mobile'] .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{grid-template-columns:repeat(' . (int) $settings['columns']['mobile'] . ',1fr)}';
					}
				} else {
					if ( null !== $settings['flexDirection']['tablet'] ) {
						$rules['tablet'] .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{flex-direction:' . esc_attr( $settings['flexDirection']['tablet'] ) . '}';
					}
					if ( null !== $settings['flexDirection']['mobile'] ) {
						$rules['mobile'] .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{flex-direction:' . esc_attr( $settings['flexDirection']['mobile'] ) . '}';
					}
					if ( null !== $settings['justifyContent']['tablet'] ) {
						$rules['tablet'] .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{justify-content:' . esc_attr( $settings['justifyContent']['tablet'] ) . '}';
					}
					if ( null !== $settings['justifyContent']['mobile'] ) {
						$rules['mobile'] .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{justify-content:' . esc_attr( $settings['justifyContent']['mobile'] ) . '}';
					}
					if ( null !== $settings['alignItems']['tablet'] ) {
						$rules['tablet'] .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{align-items:' . esc_attr( $settings['alignItems']['tablet'] ) . '}';
					}
					if ( null !== $settings['alignItems']['mobile'] ) {
						$rules['mobile'] .= '[data-mvl-uid="' . $uid . '"] > .mvl-container{align-items:' . esc_attr( $settings['alignItems']['mobile'] ) . '}';
					}
				}
				self::collect_style_rules( $node['children'], $rules );
			}
		}
	}

	private static function render_section_html( array $section, int $post_id ): string {
		$has_video     = self::has_video_bg( $section['settings'] );
		$container_tag = in_array( $section['settings']['tag'] ?? '', array( 'div', 'section', 'article' ), true ) ? $section['settings']['tag'] : 'section';
		$extra_class   = $section['settings']['classes'] ? ' ' . esc_attr( $section['settings']['classes'] ) : '';
		$id_attr       = $section['settings']['htmlId'] ? ' id="' . esc_attr( $section['settings']['htmlId'] ) . '"' : '';
		$html  = '<!-- mvl:section ' . self::json_for_comment( array( 'uid' => $section['id'], 'settings' => $section['settings'] ) ) . ' -->' . "\n";
		$html .= '<' . $container_tag . ' class="mvl-section mvl-bg-host' . ( $has_video ? ' mvl-has-video-bg' : '' ) . $extra_class . '" data-mvl-uid="' . esc_attr( $section['id'] ) . '"' . $id_attr . '>';
		if ( $has_video ) {
			$html .= self::bg_video_html( $section['settings'] );
		}
		$html .= '<div class="mvl-container">';
		foreach ( $section['children'] as $node ) {
			$html .= 'section' === $node['type'] ? self::render_section_html( $node, $post_id ) : self::render_item_html( $node, $post_id );
		}
		$html .= '</div></' . $container_tag . '>' . "\n<!-- /mvl:section -->\n";
		return $html;
	}

	private static function render_item_html( array $item, int $post_id ): string {
		$data           = $item['data'];
		$item_settings  = $item['settings'];
		$item_has_video = self::has_video_bg( $item_settings );
		$extra_class    = $item_settings['classes'] ? ' ' . esc_attr( $item_settings['classes'] ) : '';
		$id_attr        = $item_settings['htmlId'] ? ' id="' . esc_attr( $item_settings['htmlId'] ) . '"' : '';
		$attr = ' data-mvl-uid="' . esc_attr( $item['id'] ) . '"' . $id_attr;
		$html = '<!-- mvl:' . esc_html( $item['type'] ) . ' ' . self::json_for_comment( array_merge( array( 'uid' => $item['id'], 'settings' => $item_settings ), $data ) ) . ' -->' . "\n";
		$html .= '<div class="mvl-item mvl-item-' . esc_attr( $item['type'] ) . ' mvl-bg-host' . ( $item_has_video ? ' mvl-has-video-bg' : '' ) . $extra_class . '"' . $attr . '>';
		if ( $item_has_video ) {
			$html .= self::bg_video_html( $item_settings );
		}
		if ( 'heading' === $item['type'] ) { $tag = 'h' . (int) $data['level']; $html .= '<' . $tag . ' class="mvl-heading">' . esc_html( $data['text'] ) . '</' . $tag . '>'; }
		if ( 'text' === $item['type'] ) { $html .= '<div class="mvl-text">' . wpautop( wp_kses_post( $data['text'] ) ) . '</div>'; }
		if ( 'button' === $item['type'] ) {
			$text = $data['textTag'] ? self::resolve_dynamic_text( $data['textTag'], $post_id ) : '';
			$url  = $data['urlTag'] ? self::resolve_dynamic_url( $data['urlTag'], $post_id, $data ) : '';
			$text = '' !== $text ? $text : $data['text'];
			$url  = '' !== $url ? $url : $data['url'];
			$style_class = $data['buttonStyle'] ? ' mvl-btn-style-' . esc_attr( $data['buttonStyle'] ) : '';
			$html .= '<a class="mvl-button' . $style_class . '" href="' . esc_url( $url ) . '">' . esc_html( $text ) . '</a>';
		}
		if ( 'image' === $item['type'] && $data['url'] ) { $html .= '<img class="mvl-image" src="' . esc_url( $data['url'] ) . '" alt="' . esc_attr( $data['alt'] ) . '">'; }
		$html .= '</div>' . "\n<!-- /mvl:" . esc_html( $item['type'] ) . " -->\n";
		return $html;
	}

	private static function render_layout( array $layout, int $post_id ): string {
		$rules = array( 'base' => '', 'tablet' => '', 'mobile' => '' );
		self::collect_style_rules( $layout, $rules );
		$style = '<style>' . $rules['base'];
		if ( $rules['tablet'] ) {
			$style .= '@media (max-width:1024px){' . $rules['tablet'] . '}';
		}
		if ( $rules['mobile'] ) {
			$style .= '@media (max-width:767px){' . $rules['mobile'] . '}';
		}
		$style .= '</style>';

		$html = '';
		foreach ( $layout as $section ) {
			$html .= self::render_section_html( $section, $post_id );
		}
		return $style . '<div class="mvl-layout">' . $html . '</div>';
	}

	public static function enqueue_preview_assets(): void {
		$is_preview = isset( $_GET['mvl_preview'] ) && '1' === $_GET['mvl_preview'];
		if ( ! $is_preview && ! ( is_singular() && str_contains( get_post()->post_content ?? '', '<!-- mvl:document' ) ) ) {
			return;
		}
		wp_enqueue_style( 'mvl-preview', plugins_url( 'assets/preview.css', self::$plugin_file ), array(), self::asset_version( 'assets/preview.css' ) );
		wp_enqueue_script( 'mvl-preview', plugins_url( 'assets/preview.js', self::$plugin_file ), array(), self::asset_version( 'assets/preview.js' ), true );

		$variables = self::get_variables();
		/**
		 * Las Variables son de sitio entero (una sola opción), no quedan "horneadas"
		 * en el post_content como el resto del layout: se generan en cada carga a
		 * partir de get_option(), así que cambiarlas se nota en todas las páginas al
		 * instante, sin tener que volver a guardar cada una desde el maquetador.
		 */
		$css = self::variables_css( $variables );
		if ( $css ) {
			wp_add_inline_style( 'mvl-preview', $css );
		}
		$fonts_css_path = self::fonts_base_dir() . '/mvl-fonts.css';
		if ( ! empty( $variables['fonts']['registered'] ) && file_exists( $fonts_css_path ) ) {
			wp_enqueue_style( 'mvl-fonts', self::fonts_base_url() . '/mvl-fonts.css', array(), (string) filemtime( $fonts_css_path ) );
		}
	}

	/**
	 * CSS derivado de Variables: tipografía global por rol (h1-h6/párrafo), ancho
	 * máximo del contenedor, y los estilos de botón con nombre. Se comparte entre el
	 * front-end real y el <head> de la vista previa (vía enqueue_preview_assets),
	 * y su equivalente en JS (buildVariablesCss en builder.js) lo recalcula al vuelo
	 * dentro del iframe del maquetador mientras se edita, sin guardar todavía.
	 */
	private static function variables_css( array $variables ): string {
		$css = '.mvl-container{max-width:' . esc_attr( $variables['containerMaxWidth'] ) . '}';
		$role_selectors = array(
			'h1'        => '.mvl-layout h1',
			'h2'        => '.mvl-layout h2',
			'h3'        => '.mvl-layout h3',
			'h4'        => '.mvl-layout h4',
			'h5'        => '.mvl-layout h5',
			'h6'        => '.mvl-layout h6',
			'paragraph' => '.mvl-layout .mvl-text',
		);
		foreach ( $role_selectors as $role => $selector ) {
			$css .= self::typography_css( $selector, $variables['fonts']['typography'][ $role ] );
		}
		foreach ( $variables['buttonStyles'] as $style ) {
			$css .= self::button_style_css( $style );
		}
		return $css;
	}

	private static function button_style_css( array $style ): string {
		$selector = '.mvl-btn-style-' . esc_attr( $style['id'] );
		$decl     = 'color:' . esc_attr( $style['textColor'] ) . '!important;';
		if ( 'color' === $style['background']['type'] ) {
			$decl .= 'background:' . esc_attr( $style['background']['color'] ) . '!important;';
		} else {
			$decl .= 'background:transparent!important;';
		}
		$decl .= 'border-radius:' . esc_attr( $style['border']['radius'] ) . '!important;';
		if ( 'none' !== $style['border']['style'] ) {
			$decl .= 'border:' . esc_attr( $style['border']['width'] ) . ' ' . esc_attr( $style['border']['style'] ) . ' ' . esc_attr( $style['border']['color'] ) . '!important;';
		} else {
			$decl .= 'border:none!important;';
		}
		$decl .= 'padding:' . self::spacing_css( $style['padding'] ) . '!important;';
		$css = $selector . '{' . $decl . '}';
		return $css . self::typography_css( $selector, $style['typography'] );
	}

	/** Carpeta/URL en wp-content/uploads donde se guardan localmente los .woff2 de las fuentes registradas. */
	private static function fonts_base_dir(): string {
		return trailingslashit( wp_upload_dir()['basedir'] ) . 'mvl-fonts';
	}

	private static function fonts_base_url(): string {
		return trailingslashit( wp_upload_dir()['baseurl'] ) . 'mvl-fonts';
	}

	private static function variant_axis( string $variant ): array {
		switch ( $variant ) {
			case 'italic':
				return array( '1', '400' );
			case 'bold':
				return array( '0', '700' );
			case 'bolditalic':
				return array( '1', '700' );
			default:
				return array( '0', '400' );
		}
	}

	/**
	 * Descarga a wp-content/uploads/mvl-fonts SOLO los cortes (familia+variante)
	 * realmente usados en algún rol tipográfico o estilo de botón — nunca "todas
	 * las registradas" ni "todos los pesos posibles" — y regenera el CSS combinado
	 * con @font-face apuntando a esos archivos locales. Así el front nunca pide
	 * nada a fonts.googleapis.com/fonts.gstatic.com: las fuentes elegidas pero no
	 * usadas en ningún rol, y cualquier fuente no registrada, no se descargan ni se
	 * referencian en ningún sitio. Se ejecuta en el propio request de guardado de
	 * Variables (síncrono), así que guardar puede tardar unos segundos si cambiaron
	 * las fuentes; no hace ninguna llamada de red si no cambió nada relevante.
	 *
	 * @return string[] Nombres de familia que no se pudieron descargar (vacío si ninguna falló).
	 */
	private static function sync_local_fonts( array $variables ): array {
		$needed = array();
		foreach ( $variables['fonts']['typography'] as $typo ) {
			if ( '' !== $typo['family'] ) {
				$needed[ $typo['family'] ][ $typo['variant'] ] = true;
			}
		}
		foreach ( $variables['buttonStyles'] as $style ) {
			if ( '' !== $style['typography']['family'] ) {
				$needed[ $style['typography']['family'] ][ $style['typography']['variant'] ] = true;
			}
		}
		if ( empty( $needed ) ) {
			self::delete_local_fonts();
			return array();
		}
		wp_mkdir_p( self::fonts_base_dir() );
		$css    = '';
		$errors = array();
		foreach ( $needed as $family => $variants ) {
			$axis_pairs = array();
			foreach ( array_keys( $variants ) as $variant ) {
				list( $ital, $wght ) = self::variant_axis( $variant );
				$axis_pairs[ $ital . ',' . $wght ] = true;
			}
			$family_param = rawurlencode( $family ) . ':ital,wght@' . implode( ';', array_keys( $axis_pairs ) );
			$css2_url     = 'https://fonts.googleapis.com/css2?family=' . $family_param . '&display=swap';
			$response     = wp_remote_get( $css2_url, array(
				'timeout' => 15,
				// Google solo sirve woff2 (el formato más liviano) a un User-Agent moderno.
				'headers' => array( 'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36' ),
			) );
			if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
				$errors[] = $family;
				continue;
			}
			$family_css  = wp_remote_retrieve_body( $response );
			$family_slug = sanitize_title( $family );
			$family_dir  = self::fonts_base_dir() . '/' . $family_slug;
			wp_mkdir_p( $family_dir );
			$family_css = preg_replace_callback(
				'/url\\((https:\\/\\/fonts\\.gstatic\\.com\\/[^)]+)\\)/',
				static function ( $matches ) use ( $family_dir, $family_slug ) {
					$remote   = trim( $matches[1], '\'"' );
					$filename = $family_slug . '-' . md5( $remote ) . '.woff2';
					$local    = $family_dir . '/' . $filename;
					if ( ! file_exists( $local ) ) {
						$file_response = wp_remote_get( $remote, array( 'timeout' => 20 ) );
						if ( ! is_wp_error( $file_response ) && 200 === wp_remote_retrieve_response_code( $file_response ) ) {
							file_put_contents( $local, wp_remote_retrieve_body( $file_response ) );
						}
					}
					if ( ! file_exists( $local ) ) {
						return $matches[0];
					}
					return 'url(' . self::fonts_base_url() . '/' . $family_slug . '/' . $filename . ')';
				},
				$family_css
			);
			$css .= $family_css . "\n";
		}
		file_put_contents( self::fonts_base_dir() . '/mvl-fonts.css', $css );
		return $errors;
	}

	private static function delete_local_fonts(): void {
		$dir = self::fonts_base_dir();
		if ( ! is_dir( $dir ) ) {
			return;
		}
		foreach ( (array) glob( $dir . '/*' ) as $entry ) {
			if ( is_dir( $entry ) ) {
				foreach ( (array) glob( $entry . '/*' ) as $file ) {
					@unlink( $file );
				}
				@rmdir( $entry );
			} else {
				@unlink( $entry );
			}
		}
	}
}
