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
			front_end:     {
				src:  [
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
					'js/src/footer.js'
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
					'css/front-end.css'                 : 'css/src/front-end.scss'
				}
			}
		},
		clean:    {
			main:    ['release/<%= pkg.version %>'],
			modules: ['release/modules/<%= pkg.version %>'],
			side:    ['release/side_plugins/<%= pkg.version %>']
		},
		copy:     {
			// Copy the plugin to a versioned release directory
			main: {
				src:  [
					'**',
					'!developer_notes.md',
					'!readme.md',
					'!assets/**',
					'!seoslides_modules/**',
					'!side-plugins/**',
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
					'!.gitmodules',
					'!vendor/deck/introduction/**',
					'!vendor/deck/test/**',
					'!vendor/deck/boilerplate.html',
					'!vendor/deck/CHANGELOG.md',
					'!vendor/deck/jquery.min.js',
					'!vendor/deck/Makefile',
					'!vendor/deck/modernizr.custom.js',
					'!vendor/deck/README.md',
					'!vendor/deck/**/*.scss'
				],
				dest: 'release/<%= pkg.version %>/'
			},
			// Copy individual modules to a versioned release directory
			modules: {
				expand: true,
				cwd:    'seoslides_modules/',
				src:    [
					'**'
				],
				dest:   'release/modules/<%= pkg.version %>/'
			},
			side:    {
				expand: true,
				cwd:    'side-plugins/',
				src:    [
					'**'
				],
				dest:   'release/side_plugins/<%= pkg.version %>/'
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
			},
			whitelabel: {
				options: {
					mode: 'zip',
					archive: './release/side_plugins/seoslides-whitelabel.<%= pkg.version %>.zip'
				},
				expand: true,
				cwd: 'release/side_plugins/<%= pkg.version %>/seoslides-whitelabel/',
				src: ['**/*'],
				dest: 'seoslides-whitelabel/'
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
	grunt.registerTask( 'compress:side', ['compress:whitelabel'] );
	grunt.registerTask( 'build', ['default', 'clean:main', 'clean:modules', 'clean:side', 'copy:main', 'copy:modules', 'copy:side', 'compress:main', 'compress:side'] );

	grunt.util.linefeed = '\n';

};
