(function (window, tinymce, undefined) {

	window.seoslides_mce_plugin = window.seoslides_mce_plugin || {};
	var SELF = window.seoslides_mce_plugin;

	var old_init = SELF.init || SELF.noop;

	SELF.init = function (editor, url) {
		SELF.set_url(url);

		old_init(editor, url);

		editor.onPreInit.add(function (editor) {
			editor.schema.addValidElements('div[*]');
		});

		editor.onInit.add(function (editor) {
			editor.selection.onBeforeSetContent.add(function (selection) {
				var embed = SELF.get_embed(selection.getNode()),
						walker,
						target;

				if (embed) {
					if (!embed.nextSibling || SELF.is_embed(embed.nextSibling)) {
						target = editor.getDoc().createTextNode('');
						editor.dom.insertAfter(target, embed);
					} else {
						walker = new tinymce.dom.TreeWalker(embed.nextSibling, embed.nextSibling);
						target = walker.next();
					}

					selection.select(target);
					selection.collapse(true);
				}
			});

			editor.selection.onSetContent.add(function (selection, o) {
				if (!o.context) {
					return;
				}

				var node = selection.getNode();

				if (!node.innerHTML) {
					return;
				}

				node.innerHTML = SELF.to_embed(node.innerHTML);
			});
		});

		editor.onBeforeSetContent.add(function (editor, object) {
			if (!object.content || object.content.indexOf('[seoslides ') === -1) {
				return;
			}

			object.content = SELF.to_embed(object.content);
		});

		editor.onPostProcess.add(function (editor, object) {
			if ((!object.get && !object.save ) || !object.content) {
				return;
			}

			object.content = SELF.to_shortcode(object.content);
		});

		editor.onKeyDown.addToTop(function (editor, event) {
			var keyCode = event.keyCode,
					embed;

			embed = SELF.get_embed(editor.selection.getNode());
			if (embed) {
				if (event.metaKey || event.ctrlKey || ( keyCode >= 112 && keyCode <= 123 )) {
					return;
				}

				switch (keyCode) {
					case tinymce.VK.DELETE:
					case tinymce.VK.BACKSPACE:
						editor.dom.replace(editor.dom.create('p', {}, ''), embed, false);
						break;
					case tinymce.VK.ENTER:
						editor.selection.select(embed);
						editor.selection.collapse(false);
						editor.execCommand('mceInsertRawHTML', true, '<p></p>');
						break;
					case tinymce.VK.LEFT:
					case tinymce.VK.UP:
						if (embed.previousSibling) {
							editor.selection.select(embed.previousSibling);
							editor.selection.collapse(false);
						}
						break;
					case tinymce.VK.RIGHT:
					case tinymce.VK.DOWN:
						if (embed.nextSibling) {
							editor.selection.select(embed.nextSibling);
							editor.selection.collapse(true);
							if (tinymce.selection.scrollIntoView) {
								tinymce.selection.scrollIntoView(embed.nextSibling);
							}
						}
						break;
				}

				event.preventDefault();
			}
		});
	};

	/*
	 * Create the TinyMCE plugin object.
	 *
	 * See http://www.tinymce.com/wiki.php/Creating_a_plugin for more information
	 * on how to create TinyMCE plugins.
	 */
	tinymce.create('tinymce.plugins.seoslides', SELF);

	// Add the plugin object to the TinyMCE plugin manager
	tinymce.PluginManager.add('seoslides', tinymce.plugins.seoslides);

})(this, this.tinymce || {});