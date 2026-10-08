<?php
/** Pruebas de integración; ejecutar mediante WP-CLI eval-file. */

function mvl_comprobar( bool $resultado, string $mensaje ): void {
	if ( ! $resultado ) {
		throw new RuntimeException( $mensaje );
	}
}

$sanitizar = new ReflectionMethod( MVL_Plugin::class, 'sanitize_layout' );
$renderizar = new ReflectionMethod( MVL_Plugin::class, 'render_layout' );
$modelo = array(
	array(
		'id' => 'prueba-laptop', 'type' => 'section',
		'settings' => array(
			'display' => 'grid',
			'columns' => array( 'desktop' => 4, 'laptop' => 3, 'tablet' => 2, 'mobile' => 1 ),
			'gap' => array( 'desktop' => '40px', 'laptop' => '30px', 'tablet' => null, 'mobile' => '10px' ),
			'background' => array( 'desktop' => array( 'type' => 'color', 'color' => '#ffffff' ), 'laptop' => array( 'type' => 'color', 'color' => '#abcdef' ) ),
			'padding' => array( 'desktop' => array( 'top' => '48px' ), 'laptop' => array( 'top' => '32px' ) ),
		),
		'children' => array( array( 'id' => 'texto-prueba', 'type' => 'text', 'data' => array( 'text' => 'Prueba áéíóú' ), 'settings' => array( 'margin' => array( 'desktop' => array(), 'laptop' => array( 'top' => '12px' ) ) ) ) ),
	),
);
$modelo[] = array(
	'id' => 'prueba-flex', 'type' => 'section',
	'settings' => array(
		'flexDirection' => array( 'desktop' => 'row', 'laptop' => 'column' ),
		'justifyContent' => array( 'desktop' => 'flex-start', 'laptop' => 'center' ),
		'alignItems' => array( 'desktop' => 'stretch', 'laptop' => 'flex-end' ),
		'textAlign' => array( 'desktop' => 'left', 'laptop' => 'right' ),
		'border' => array( 'desktop' => array(), 'laptop' => array( 'style' => 'solid', 'width' => '2px', 'color' => '#123456', 'radius' => '8px' ) ),
	),
	'children' => array(),
);
$normalizado = $sanitizar->invoke( null, $modelo );
$html = $renderizar->invoke( null, $normalizado, 0 );
mvl_comprobar( str_contains( $html, 'background:#abcdef' ), 'Falta el fondo Laptop' );
mvl_comprobar( str_contains( $html, 'gap:30px' ), 'Falta el gap Laptop' );
mvl_comprobar( str_contains( $html, 'margin:12px' ), 'Falta el margen Laptop en el bloque hijo' );
foreach ( array( 'flex-direction:column', 'justify-content:center', 'align-items:flex-end', 'text-align:right', 'border:2px solid #123456', 'padding:32px' ) as $propiedad ) {
	mvl_comprobar( str_contains( $html, $propiedad ), 'Falta el ajuste Laptop: ' . $propiedad );
}
$posiciones = array_map( static fn( $ancho ) => strpos( $html, '@media (max-width:' . $ancho . 'px)' ), array( 1366, 1024, 767 ) );
mvl_comprobar( false !== $posiciones[0] && $posiciones[0] < $posiciones[1] && $posiciones[1] < $posiciones[2], 'Orden incorrecto de breakpoints' );
$antiguo = $modelo;
foreach ( $antiguo[0]['settings'] as &$ajuste ) {
	if ( is_array( $ajuste ) ) {
		unset( $ajuste['laptop'] );
	}
}
unset( $ajuste );
$viejo = $sanitizar->invoke( null, $antiguo );
mvl_comprobar( null === $viejo[0]['settings']['columns']['laptop'] && 2 === $viejo[0]['settings']['columns']['tablet'], 'Compatibilidad con documento antiguo' );
$plano = $sanitizar->invoke( null, array( array( 'type' => 'section', 'settings' => array( 'gap' => '22px' ) ) ) );
mvl_comprobar( '22px' === $plano[0]['settings']['gap']['desktop'] && null === $plano[0]['settings']['gap']['laptop'], 'Compatibilidad con ajuste plano' );

$post_id = wp_insert_post( array( 'post_type' => 'page', 'post_status' => 'draft', 'post_title' => 'Prueba automática temporal Laptop' ), true );
if ( is_wp_error( $post_id ) ) {
	throw new RuntimeException( $post_id->get_error_message() );
}
try {
	$peticion = new WP_REST_Request( 'POST' );
	$peticion['id'] = $post_id;
	$peticion->set_param( 'layout', $modelo );
	$respuesta = MVL_Plugin::save_layout_route( $peticion )->get_data();
	mvl_comprobar( ! empty( $respuesta['saved'] ), 'Error al guardar' );
	$recuperar = new ReflectionMethod( MVL_Plugin::class, 'get_layout' );
	mvl_comprobar( $recuperar->invoke( null, $post_id ) === $normalizado, 'El árbol cambia al guardar y recuperar' );
} finally {
	wp_delete_post( $post_id, true );
}

// Datos saneados para comprobar el generador JavaScript con el mismo árbol.
if ( getenv( 'MVL_PRUEBA_JSON' ) ) {
	file_put_contents( getenv( 'MVL_PRUEBA_JSON' ), wp_json_encode( array( 'layout' => $normalizado, 'html' => $html ) ) );
}
echo "Correcto: Laptop, orden CSS, compatibilidad y guardado/recuperación.\n";
