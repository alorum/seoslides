module.exports = function ( grunt ) {

	// Project configuration.
	grunt.initConfig( {
		pkg:      grunt.file.readJSON( 'package.json' ),
		meta:     {
			banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
				'<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
				'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
				' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
		},
		concat:   {
			options:       {
				stripBanners: true,
				banner:       '/*! <%= pkg.name %> - v<%= pkg.version %>\n' +
					' * https://seoslides.com\n' +
					' * Copyright (c) <%= grunt.template.today("yyyy") %> Alroum;' +
					' * Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>' +
					' */\n'
			},
			track: {
				src: [
					'js/src/tracking.js'
				],
				dest: 'js/seoslides_track.src.js'
			},
			front_end:     {
				src:  [
					'js/lib/deck.core.js',
					'js/lib/deck.hash.js',
					'js/lib/deck.menu.js',
					'js/lib/deck.goto.js',
					'js/lib/deck.status.js',
					'js/lib/deck.navigation.js',
					'js/lib/jquery.backstretch.js',
					'js/src/responsivetext.js',
					'js/lib/canvas/js/seoslides.js',
					'js/lib/canvas/js/seoslides.events.js',
					'js/src/debouncer.js',
					'js/lib/canvas/js/seoslides.plugin.js',
					'js/src/seoslides.image.js',
					'js/src/seoslides.wysiwyg.js',
					'js/src/slide-builder.js',
					'js/src/front-end-plugins.js',
					'js/lib/jquery.touchSwipe.js',
					'js/src/front.js',
					'js/src/embed-code.js'
				],
				dest: 'js/seoslides_front.src.js'
			},
			back_end:      {
				src:  [
					'js/lib/jquery.backstretch.js',
					'js/src/responsivetext.js',
					'js/lib/canvas/js/seoslides.js',
					'js/lib/canvas/js/seoslides.events.js',
					'js/src/debouncer.js',
					'js/lib/canvas/js/seoslides.slide.js',
					'js/lib/canvas/js/seoslides.menu.js',
					'js/lib/canvas/js/seoslides.pluggables.js',
					'js/lib/canvas/js/seoslides.plugin.js',
					'js/lib/canvas/js/seoslides.bucket.js',
					'js/src/imagepicker.js',
					'js/src/seoslides.modal.js',
					'js/src/seoslides.image.js',
					'js/src/seoslides.wysiwyg.js',
					'js/src/slide-builder.js',
					'js/src/linker.js',
					'js/src/slides.js',
					'js/src/popup.js'
				],
				dest: 'js/seoslides_admin.src.js'
			},
			list:          {
				src:  [
					'js/lib/jquery.backstretch.js',
					'js/src/responsivetext.js',
					'js/lib/canvas/js/seoslides.js',
					'js/lib/canvas/js/seoslides.events.js',
					'js/src/debouncer.js',
					'js/lib/canvas/js/seoslides.plugin.js',
					'js/src/seoslides.image.js',
					'js/src/seoslides.wysiwyg.js',
					'js/src/front-end-plugins.js',
					'js/src/slide-builder.js',
					'js/src/list.js',
					'js/src/popup.js'
				],
				dest: 'js/seoslides_list.src.js'
			},
			poly_fill:     {
				src:  [
					'js/src/html-elements.js',
					'js/lib/poly_fill.js'
				],
				dest: 'js/poly_fill.src.js'
			},
			embed:         {
				src:  [
					'js/lib/dom-ready.js',
					'js/src/embed.js'
				],
				dest: 'js/seoslides_embed.src.js'
			},
			editor_plugin: {
				src:  [
					'js/src/editor.common.js',
					'js/src/editor.command.js',
					'js/src/editor_plugin.js'
				],
				dest: 'js/editor_plugin_src.js'
			},
			converter:     {
				src:  [
					'js/src/seoslides.converter.js'
				],
				dest: 'js/seoslides_converter.src.js'
			},
			multiplier: {
				src: [
					'js/src/seoslides.multiplier.js'
				],
				dest: 'js/seoslides_multiplier.src.js'
			}
		},
		jshint:   {
			all:     [
				'Gruntfile.js',
				'js/src/**/*.js',
				'js/test/**/*.js'
			],
			options: {
				curly:   true,
				eqeqeq:  true,
				immed:   true,
				latedef: true,
				newcap:  true,
				noarg:   true,
				sub:     true,
				undef:   true,
				boss:    true,
				eqnull:  true,
				globals: {
					exports: true,
					module:  false
				}
			}
		},
		uglify:   {
			options:       {
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %>\n' +
					' * https://seoslides.com\n' +
					' * Copyright (c) <%= grunt.template.today("yyyy") %> Alorum;' +
					' * Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>' +
					' */\n',
				mangle: {
					except: ['jQuery', 'SEO_Slides', 'seoslides']
				}
			},
			track:         { files: { 'js/seoslides_track.min.js': 'js/seoslides_track.src.js' } },
			front_end:     { files: { 'js/seoslides_front.min.js': 'js/seoslides_front.src.js' } },
			back_end:      { files: { 'js/seoslides_admin.min.js': 'js/seoslides_admin.src.js' } },
			list:          { files: { 'js/seoslides_list.min.js': 'js/seoslides_list.src.js' } },
			poly_fill:     { files: { 'js/poly_fill.min.js': 'js/poly_fill.src.js' } },
			embed:         { files: { 'js/seoslides_embed.min.js': 'js/seoslides_embed.src.js' } },
			editor_plugin: { files: { 'js/editor_plugin.js': 'js/editor_plugin_src.js' } },
			converter:     { files: { 'js/seoslides_converter.min.js': 'js/seoslides_converter.src.js' } },
			multiplier:    { files: { 'js/seoslides_multiplier.min.js': 'js/seoslides_multiplier.src.js' } }
		},
		test:     {
			files: ['test/**/*.js']
		},
		watch:    {
			front_end:     {
				files:   '<%= concat.front_end.src %>',
				tasks:   [ 'jshint', 'concat:front_end', 'uglify:front_end'],
				options: {
					debounceDelay: 500
				}
			},
			back_end:      {
				files:   '<%= concat.back_end.src %>',
				tasks:   [ 'jshint', 'concat:back_end', 'uglify:back_end'],
				options: {
					debounceDelay: 500
				}
			},
			list:          {
				files:   '<%= concat.list.src %>',
				tasks:   [ 'jshint', 'concat:list', 'uglify:list'],
				options: {
					debounceDelay: 500
				}
			},
			poly_fill:     {
				files:   '<%= concat.poly_fill.src %>',
				tasks:   [ 'jshint', 'concat:poly_fill', 'uglify:poly_fill'],
				options: {
					debounceDelay: 500
				}
			},
			embed:         {
				files:   '<%= concat.embed.src %>',
				tasks:   [ 'jshint', 'concat:embed', 'uglify:embed'],
				options: {
					debounceDelay: 500
				}
			},
			editor_plugin: {
				files:   '<%= concat.editor_plugin.src %>',
				tasks:   [ 'jshint', 'concat:editor_plugin', 'uglify:editor_plugin'],
				options: {
					debounceDelay: 500
				}
			},
			styles:        {
				files:   ['css/src/*.scss'],
				tasks:   ['sass'],
				options: {
					debounceDelay: 500
				}
			}
		},
		sass:     {
			all: {
				files: {
					'css/admin-styles.css'              : 'css/src/admin-styles.scss',
					'css/admin-styles-slides.css'       : 'css/src/admin-styles-slides.scss',
					'css/front-end.css'                 : 'css/src/themes/front-end.scss',
					'css/front-end.vertical.css'        : 'css/src/themes/front-end.vertical.scss',
					'css/front-end.fade.css'            : 'css/src/themes/front-end.fade.scss',
					'css/front-end.none.css'            : 'css/src/themes/front-end.none.scss',
					'css/front-end.none.horizontal.css' : 'css/src/themes/front-end.none.horizontal.scss',
					'css/front-end.none.vertical.css'   : 'css/src/themes/front-end.none.vertical.scss',
					'css/front-end.none.fade.css'       : 'css/src/themes/front-end.none.fade.scss',
					'css/front-end.none.none.css'       : 'css/src/themes/front-end.none.none.scss',
					'css/front-end.neon.horizontal.css' : 'css/src/themes/front-end.neon.horizontal.scss',
					'css/front-end.neon.vertical.css'   : 'css/src/themes/front-end.neon.vertical.scss',
					'css/front-end.neon.fade.css'       : 'css/src/themes/front-end.neon.fade.scss',
					'css/front-end.neon.none.css'       : 'css/src/themes/front-end.neon.none.scss',
					'css/front-end.web.horizontal.css'  : 'css/src/themes/front-end.web.horizontal.scss',
					'css/front-end.web.vertical.css'    : 'css/src/themes/front-end.web.vertical.scss',
					'css/front-end.web.fade.css'        : 'css/src/themes/front-end.web.fade.scss',
					'css/front-end.web.none.css'        : 'css/src/themes/front-end.web.none.scss'
				}
			}
		},
		clean:    {
			main:    ['release/<%= pkg.version %>']
		},
		copy:     {
			// Copy the plugin to a versioned release directory
			main: {
				src:  [
					'**',
					'!developer_notes.md',
					'!assets/**',
					'!node_modules/**',
					'!release/**',
					'!.git/**',
					'!.sass-cache/**',
					'!css/src/**',
					'!js/src/**',
					'!img/src/**',
					'!Gruntfile.js',
					'!package.json',
					'!.gitignore',
					'!.gitmodules'
				],
				dest: 'release/<%= pkg.version %>/'
			}
		},
		compress: {
			main: {
				options: {
					mode: 'zip',
					archive: './release/seoslides.<%= pkg.version %>.zip'
				},
				expand: true,
				cwd: 'release/<%= pkg.version %>/',
				src: ['**/*'],
				dest: 'seoslides/'
			}
		}
	} );

	// Load other tasks
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-concat' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-contrib-sass' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );
	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-contrib-copy' );
	grunt.loadNpmTasks( 'grunt-contrib-compress' );

	// Default task.
	grunt.registerTask( 'default', ['jshint', 'concat', 'uglify', 'sass'] );

	// Build task
	grunt.registerTask( 'build', ['default', 'clean:main', 'copy:main', 'compress:main'] );

	grunt.util.linefeed = '\n';

};
