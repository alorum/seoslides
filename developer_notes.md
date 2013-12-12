# Developer Notes

## Build System

The plugin build system uses Grunt to pre-flight JS/CSS files, concatenate/minify them, and then to package up the final release.

Running `grunt build` from the command line will run the standard Grunt process, followed by a cleaning of any existing `/release/{version/` directory.
The plugin will then be copied to `/release/{version}` and automatically compressed to a distributable Zip file: `/release/seoslides.{version}.zip`.

## Pro Modules

Professional modules live in the `/seoslides_modules` subdirectory.  This directory is *not* copied to the `/release` folder as part of the build process.
Modules will be copied instead to the `/release/modules_{version}` directory.

The `/seoslides_modules` directory should be symlinked in your filesystem as `/wp-content/seoslides_modules` for testing.