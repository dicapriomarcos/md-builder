<?php
/**
 * Plugin Name: Maquetador Visual Ligero
 * Description: MVP de maquetador visual sin dependencias de Gutenberg.
 * Version: 0.1.0
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * Text Domain: maquetador-visual-ligero
 * License: GPL-2.0-or-later
 */

declare( strict_types=1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-mvl-plugin.php';

MVL_Plugin::init( __FILE__ );

