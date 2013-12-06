(function (window, undefined) {

	window.seoslides_mce_plugin = window.seoslides_mce_plugin || {};
	var SELF = window.seoslides_mce_plugin,
			patterns = {
				image_to_shortcode: /(?:<div class="mceItem seoslides_embed"[^>]*>).*?(<img[^>]+>).*?(?:<h2[^>]*>(.*?)<\/h2>)?.*?(?:<\/div>)/gi,
				shortcode_to_image: /\[seoslides( [^\]]+)+( \/)?\]/gi
			};

	function _to_shortcode(matched_string, image_text, title_text) {
		var image_class = SELF.get_attribute(image_text, 'class');

		if (image_class.indexOf('seoslides_shortcode') !== -1) {
			var data_object = SELF.get_all_attributes(image_text, /^data-seoslides-/i),
					replace_text = '[seoslides ',
					name;
			for (name in data_object) {
				if (data_object.hasOwnProperty(name)) {
					replace_text += name.replace(/^data-seoslides-/i, '').replace('-', '_');
					replace_text += '="' + data_object[name] + '" ';
				}
			}

			if (title_text) {
				replace_text += 'title="' + title_text + '" ';
			}

			replace_text += '/]</p>';
			return replace_text;
		}

		return matched_string;
	}

	function _to_image(shortcode) {
		var attributes = SELF.get_all_attributes(shortcode),
				return_string,
				name;

		return_string = '<div class="mceItem seoslides_embed" style="position:relative;margin:0 0 24px;margin:0 0 1.714285714rem;" contenteditable="false">';
		return_string += '<img src="' + SELF.image_url('shortcode.png');
		return_string += '" alt="" class="mceItem seoslides_shortcode"';

		for (name in attributes) {
			if (attributes.hasOwnProperty(name)) {
				if (name === 'title') {
					continue;
				}
				return_string += ' data-seoslides-' + name.replace('_', '-');
				return_string += '="' + attributes[name] + '"';
			}
		}

		return_string += ' />';
		if (attributes.title !== undefined) {
			return_string += '<h2 style="position:absolute;top:20px;left:20px;width:560px;">' + attributes.title + '</h2>';
		}
		return_string += '</div>';

		return return_string;
	}

	SELF.url = null;

	SELF.set_url = function (url) {
		if (!SELF.url) {
			SELF.url = url.replace(/\/js(\/.*)?$/i, '');
		}
	};

	SELF.image_url = function (name, size) {
		if (size) {
			name = name.replace(/(\.[a-z]+)$/i, '-' + size + '$1');
		}
		return SELF.url + '/img/' + name;
	};

	SELF.get_embed = function (node) {
		while (node) {
			if (SELF.is_embed(node)) {
				return node;
			}
			node = node.parentNode;
		}
	};

	SELF.is_embed = function (node) {
		return (/(?:^|\s)seoslides_embed(?:\s|$)/).test(node.className);
	};

	SELF.get_attribute = function (string, attribute_name) {
		var results = SELF.get_all_attributes(string, attribute_name);
		return results[attribute_name] ? results[attribute_name] : '';
	};

	SELF.get_all_attributes = function (string, name_pattern) {
		var attributes = {},
				match;
		while (match = (/ ([\-_a-z0-9]+)="([^"]*)"/i).exec(string)) {
			string = string.replace(match[0], '');
			if (name_pattern && ((name_pattern.test && !name_pattern.test(match[1])) || (typeof name_pattern === 'string' && name_pattern !== match[1]))) {
				continue;
			}
			attributes[match[1]] = match[2];
		}
		return attributes;
	};

	SELF.to_embed = function (text) {
		return text.replace(patterns.shortcode_to_image, _to_image);
	};

	SELF.to_shortcode = function (text) {
		return text.replace(patterns.image_to_shortcode, _to_shortcode);
	};

	SELF.noop = function () {
	};

}(this));