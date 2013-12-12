/*! seoslides - v1.2.0
 * https://seoslides.com
 * Copyright (c) 2013 Alorum; * Licensed GPLv2+ */
!function(a,b){function c(a,b,c){var d=e.get_attribute(b,"class");if(-1!==d.indexOf("seoslides_shortcode")){var f,g=e.get_all_attributes(b,/^data-seoslides-/i),h="[seoslides ";for(f in g)g.hasOwnProperty(f)&&(h+=f.replace(/^data-seoslides-/i,"").replace("-","_"),h+='="'+g[f]+'" ');return c&&(h+='title="'+c+'" '),h+="/]</p>"}return a}function d(a){var c,d,f=e.get_all_attributes(a);c='<div class="mceItem seoslides_embed" style="position:relative;margin:0 0 24px;margin:0 0 1.714285714rem;" contenteditable="false">',c+='<img src="'+e.image_url("shortcode.png"),c+='" alt="" class="mceItem seoslides_shortcode"';for(d in f)if(f.hasOwnProperty(d)){if("title"===d)continue;c+=" data-seoslides-"+d.replace("_","-"),c+='="'+f[d]+'"'}return c+=" />",f.title!==b&&(c+='<h2 style="position:absolute;top:20px;left:20px;width:560px;">'+f.title+"</h2>"),c+="</div>"}a.seoslides_mce_plugin=a.seoslides_mce_plugin||{};var e=a.seoslides_mce_plugin,f={image_to_shortcode:/(?:<div class="mceItem seoslides_embed"[^>]*>).*?(<img[^>]+>).*?(?:<h2[^>]*>(.*?)<\/h2>)?.*?(?:<\/div>)/gi,shortcode_to_image:/\[seoslides( [^\]]+)+( \/)?\]/gi};e.url=null,e.set_url=function(a){e.url||(e.url=a.replace(/\/js(\/.*)?$/i,""))},e.image_url=function(a,b){return b&&(a=a.replace(/(\.[a-z]+)$/i,"-"+b+"$1")),e.url+"/img/"+a},e.get_embed=function(a){for(;a;){if(e.is_embed(a))return a;a=a.parentNode}},e.is_embed=function(a){return/(?:^|\s)seoslides_embed(?:\s|$)/.test(a.className)},e.get_attribute=function(a,b){var c=e.get_all_attributes(a,b);return c[b]?c[b]:""},e.get_all_attributes=function(a,b){for(var c,d={};c=/ ([\-_a-z0-9]+)="([^"]*)"/i.exec(a);)a=a.replace(c[0],""),b&&(b.test&&!b.test(c[1])||"string"==typeof b&&b!==c[1])||(d[c[1]]=c[2]);return d},e.to_embed=function(a){return a.replace(f.shortcode_to_image,d)},e.to_shortcode=function(a){return a.replace(f.image_to_shortcode,c)},e.noop=function(){}}(this),function(a,b){function c(a){var c=b(this),d=b(l.getElementById("seoslides-search-panel")),e=j.dialog.wpdialog("widget");c.toggleClass("toggle-arrow-active"),d.slideToggle(300,function(){var a=h.scrollTop(),b=e.offset().top,c=b+e.outerHeight(),d=c-h.height();d>a&&e.animate({top:b>d?b=d:a},200)}),a.preventDefault()}function d(a){a.windowManager.open({id:"seoslides-embed",width:360,height:"auto",wpDialog:!0,title:a.getLang("seoslides.window_title")},{plugin_url:i.url})}a.seoslides_mce_plugin=a.seoslides_mce_plugin||{};var e,f,g,h=b(a),i=a.seoslides_mce_plugin,j={},k={},l=a.document,m=150,n=200,o=5;f=function(a,c){var d=this;this.element=a,this.ul=a.children("ul"),this.waiting=a.find(".river-waiting"),this.change(c),this.refresh(),a.scroll(function(){d.maybeLoad()}),a.delegate("li","click",function(a){d.select(b(this),a)})},b.extend(f.prototype,{refresh:function(){this.deselect(),this.visible=this.element.is(":visible")},show:function(){this.visible||(this.deselect(),this.element.show(),this.visible=!0)},hide:function(){this.element.hide(),this.visible=!1},select:function(a,b){var c,d,e,f;a.hasClass("unselectable")||a===this.selected||(this.deselect(),this.selected=a.addClass("selected"),c=a.outerHeight(),d=this.element.height(),e=a.position().top,f=this.element.scrollTop(),0>e?this.element.scrollTop(f+e):e+c>d&&this.element.scrollTop(f+e-d+c),this.element.trigger("river-select",[a,b,this]))},deselect:function(){this.selected&&this.selected.removeClass("selected"),this.selected=!1},prev:function(){if(this.visible){var a;this.selected&&(a=this.selected.prev("li"),a.length&&this.select(a))}},next:function(){if(this.visible){var a=this.selected?this.selected.next("li"):b("li:not(.unselectable):first",this.element);a.length&&this.select(a)}},ajax:function(a){var b=this,c=1===this.query.page?0:n,d=e.delayedCallback(function(c,d){b.process(c,d),a&&a(c,d)},c);this.query.ajax(d)},change:function(a){this.query&&this._search===a||(this._search=a,this.query=new g(a),this.element.scrollTop(0))},process:function(c,d){var e="",f=!0,g="",h=1===d.page;c?b.each(c,function(){g=f?"alternate":"",g+=this.title?"":" no-title",e+=g?'<li class="'+g+'">':"<li>",e+='<input type="hidden" class="item-shortcode" value="'+this.shortcode+'" />',e+='<span class="item-title">',e+=this.title?this.title:a.wpLinkL10n.noTitle,e+='</span><span class="item-info">'+this.info+"</span></li>",f=!f}):h&&(e+='<li class="unselectable"><span class="item-title"><em>'+a.wpLinkL10n.noMatchesFound+"</em></span></li>"),this.ul[h?"html":"append"](e)},maybeLoad:function(){var b=this,c=this.element,d=c.scrollTop()+c.height();!this.query.ready()||d<this.ul.height()-o||a.setTimeout(function(){var a=c.scrollTop(),d=a+c.height();!b.query.ready()||d<b.ul.height()-o||(b.waiting.show(),c.scrollTop(a+b.waiting.outerHeight()),b.ajax(function(){b.waiting.hide()}))},m)}}),g=function(a){this.page=1,this.allLoaded=!1,this.querying=!1,this.search=a},b.extend(g.prototype,{ready:function(){return!(this.querying||this.allLoaded)},ajax:function(c){var d=this,e={action:"seoslides-embed-ajax",page:this.page,nonce:j.nonce};this.search&&(e.search=this.search),this.querying=!0,b.post(a.ajaxurl,e,function(a){d.page++,d.querying=!1,d.allLoaded=!a,c(a,e)},"json")}}),e={init:function(){j.dialog=b(l.getElementById("seoslides-embed")),j.submit=b(l.getElementById("seoslides-embed-submit")),j.textarea=b(l.getElementById("seoslides-embed-textarea")),j.nonce=l.getElementById("seoslides-embed-nonce").value,j.search=b(l.getElementById("seoslides-search-field")),b(l.getElementById("seoslides-embed-cancel")).click(function(a){a.preventDefault(),e.close()}),j.submit.click(function(a){a.preventDefault(),e.update()}),k.search=new f(b(l.getElementById("seoslides-search-results"))),k.recent=new f(b(l.getElementById("seoslides-recent-results"))),k.elements=b(".query-results",j.dialog),j.dialog.on("click",".toggle-arrow",c),j.dialog.on("wpdialogrefresh",e.refresh),j.search.on("keyup",e.searchInternalLinks),k.elements.on("river-select",e.updateFields)},refresh:function(){k.search.refresh(),k.recent.refresh(),k.recent.ul.children().length||k.recent.ajax()},searchInternalLinks:function(){var a,c=b(this),d=c.val();if(d.length>2){if(k.recent.hide(),k.search.show(),e.lastSearch===d)return;e.lastSearch=d,a=c.parent().find(".spinner").show(),k.search.change(d),k.search.ajax(function(){a.hide()})}else k.search.hide(),k.recent.show()},cleanTags:function(a){return a.replace(/<[^>\n]+>/g,function(){return""})},onOpen:function(a,b){if(b&&b.wpDialog&&b.id&&"seoslides-embed"===b.id){j.textarea.val("");var c=i.get_embed(a.editor.selection.getNode());if(c){a.editor.selection.select(c);var d=a.editor.selection.getContent();j.textarea.val(e.cleanTags(d))}}},updateFields:function(a,b,c){j.textarea.val(b.children(".item-shortcode").val()),c&&"click"===c.type&&j.textarea.focus()},update:function(){var b=a.tinyMCEPopup,c=(b.editor,j.textarea.val()),d=i.to_embed(c);b.restoreSelection(),d!==c&&(b.execCommand("mceBeginUndoLevel"),b.execCommand("mceInsertRawHtml",!0,d),b.execCommand("mceEndUndoLevel")),e.close(),j.textarea.val("")},delayedCallback:function(b,c){var d,e,f,g;return c?(a.setTimeout(function(){return e?b.apply(g,f):(d=!0,void 0)},c),function(){return d?b.apply(this,arguments):(f=arguments,g=this,e=!0,void 0)}):b},close:function(){a.tinyMCEPopup.close(),j.textarea.val("")}},b(l).ready(e.init),i.embed_command=d;var p=i.init||i.noop;i.init=function(a,b){p(a,b),a.addCommand("seoslides",function(){d(a)}),a.addButton("seoslides",{title:"seoslides.button_desc",cmd:"seoslides",image:i.image_url("tinymce-button.png")}),a.onNodeChange.add(function(a,b,c){var d=i.get_embed(c),e=!!d;b.setActive("seoslides",e),e&&b.setActive("link",!1)}),a.onBeforeRenderUI.add(function(){a.windowManager.onOpen.add(e.onOpen)})}}(this,this.jQuery,this.tinymce||{}),function(a,b){a.seoslides_mce_plugin=a.seoslides_mce_plugin||{};var c=a.seoslides_mce_plugin,d=c.init||c.noop;c.init=function(a,e){c.set_url(e),d(a,e),a.onPreInit.add(function(a){a.schema.addValidElements("div[*]")}),a.onInit.add(function(a){a.selection.onBeforeSetContent.add(function(d){var e,f,g=c.get_embed(d.getNode());g&&(!g.nextSibling||c.is_embed(g.nextSibling)?(f=a.getDoc().createTextNode(""),a.dom.insertAfter(f,g)):(e=new b.dom.TreeWalker(g.nextSibling,g.nextSibling),f=e.next()),d.select(f),d.collapse(!0))}),a.selection.onSetContent.add(function(a,b){if(b.context){var d=a.getNode();d.innerHTML&&(d.innerHTML=c.to_embed(d.innerHTML))}})}),a.onBeforeSetContent.add(function(a,b){b.content&&-1!==b.content.indexOf("[seoslides ")&&(b.content=c.to_embed(b.content))}),a.onPostProcess.add(function(a,b){(b.get||b.save)&&b.content&&(b.content=c.to_shortcode(b.content))}),a.onKeyDown.addToTop(function(a,d){var e,f=d.keyCode;if(e=c.get_embed(a.selection.getNode())){if(d.metaKey||d.ctrlKey||f>=112&&123>=f)return;switch(f){case b.VK.DELETE:case b.VK.BACKSPACE:a.dom.replace(a.dom.create("p",{},""),e,!1);break;case b.VK.ENTER:a.selection.select(e),a.selection.collapse(!1),a.execCommand("mceInsertRawHTML",!0,"<p></p>");break;case b.VK.LEFT:case b.VK.UP:e.previousSibling&&(a.selection.select(e.previousSibling),a.selection.collapse(!1));break;case b.VK.RIGHT:case b.VK.DOWN:e.nextSibling&&(a.selection.select(e.nextSibling),a.selection.collapse(!0),b.selection.scrollIntoView&&b.selection.scrollIntoView(e.nextSibling))}d.preventDefault()}})},b.create("tinymce.plugins.seoslides",c),b.PluginManager.add("seoslides",b.plugins.seoslides)}(this,this.tinymce||{});