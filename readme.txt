=== seoslides ===
Contributors: alorum, 10up
Donate link: http://alorum.com
Tags: adopt-me, presentation, seoslides, seo slides, seo, slide, slides, slide deck, search engine optimization, search engine, slideshow, bing, canonical, description, google, keywords, meta, meta description, meta keywords, wordpress seo, yahoo, alorum, 10up, wordpress seo, image, images, video, text, quotes, leads, youtube, vimeo, slideshare, content, back link, backlink, backlinks, social, social media, facebook, twitter
Requires at least: 3.5.1
Tested up to: 3.9.1
Stable tag: 1.7.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Add embeddable, social content to WordPress

== Description ==

**seoslides is no longer under active development and is looking for a new home.**

WordPress content is now social!

Need your content to make an impact to grow your reach, influence your visitors, and close leads?

Use the same techniques the large platforms - like YouTube and SlideShare - use your content to grow... to grow your own WordPress site.

**Supersize your SEO efforts:** Every quote, image, video, or presentation slide is a page with SEO-optimizable notes.

**Embed your content:** Stop sending all of your content's backlinks to the platforms, give your users a way to embed your content that points back to you.

**Post to social media:** Your content can be shared to social media with the click of a button, right from the embeddable player.

Upgrade at [https://seoslides.com/paid-subscription/](https://seoslides.com/paid-subscription/) 


== Installation ==

= Easy Installation =

Select “Add New” from the “Plugins” option in your WordPress administration panel.

Using the form, search “seoslides” and click “Activate.”

You will notice the “Presentations” option appear in your WordPress administration panel.

= Manual Installation =

1. Upload the entire `/seoslides` folder to the `/wp-content/plugins/` directory.
1. Activate seoslides through the 'Plugins' menu in WordPress.
1. Begin creating presentations through the Presentations menu in the WordPress admin sidebar.

== Frequently Asked Questions ==

= How easy is it to make an image shareable? =

Just 3 clicks!

= How about multiple images in a gallery? =

Add 1 click per picture!

= How about a video from YouTube or Vimeo? =

Simply cut and paste the address!

= Presentations? =

We can import a PDF in 2 clicks with free registration!

= Can I use it to present at WordCamp? =

Strongly encouraged!

= Is the content trackable? =

We work with Google Analytics natively, every element is trackable!

= Will you give me free media to use? =

Yes, with free registration!

= What about pro features? =

How about unlimited PDF imports, priority support, and even more coming soon?

= Need more help? =

Our support form is built into the plugin!

You'll also find more FAQs on [https://seoslides.com/faq/](https://seoslides.com/faq/).

== Screenshots ==

1. Full Screen Presentations with HTML or Full Screen Background Images
1. Full Screen Movies Work Too
1. Notes Available for Every Slide
1. WordPress First Canvas Based Editor
1. Notes Editor
1. Presentation Manager
1. Publish to seoslid.es & Control Your Backlinks

== Changelog ==

= 1.7.0 =

* New: Mark the plugin as available for adoption

= 1.6.0 =

* New: Allow bulk creation of slides from existing (or uploaded) images in the media gallery.
* New: Add a button to allow easy embedding of presentations directly from the presentation editor.
* Update: Update language in the readme.

= 1.5.2 =

* Update: Play embedded videos in a modal so we don't kill navigation. Clicking a close button will stop the video.
* Fix: More flexible upgrade routine (prevent newer versions from skipping upgrades).
* Fix: Make sure the "no transition" transition works for presentations.

= 1.5.1 =

* Fix: Make sure themes/plugins can't remove rel=canonical (this will break the slide fetching mechanism).
* Fix: Auto-flush permalinks upon upgrade.

= 1.5.0 =

* New: Add a loading indicator to the front-end nav while slides are loading in the background.
* New: Cache the entire presentation's markup in a WordPress endpoint to make it cacheable on the server.
* New: Add slide numbers (for navigation status) to the footer bar.
* New: If Google Analytics' `_gaq` tracker is available, notify the tracker that we're navigating through the slideset as we go.
* New: Enable setting the height/width of the embed using shortcode parameters.
* Fix: YouTube videos now pause upon navigating to the next slide.
* Fix: Vimeo videos now pause upon navigating to the next slide.
* Fix: Hide navigation on mobile since it's not quite functional anyway.
* Fix: Better handling for imports larger than the max 64MB filesize.
* Fix: Update TinyMCE code to be compatible with WordPress 3.9.
* Fix: Patch a bug incorrectly forcing editors to remove media despite no media being present.
* Fix: Slide titles now automatically descend from the presentation title.

= 1.4.1 =

* New: Darken overlays for more consistent branding and UI.
* New: If no description is provided and notes are blank, fall back on the slide title for open graph tags.
* New: To avoid videos stealing swipes on mobile, video embeds will now present their thumbnail and a message apologizing for their unavailability on mobile.

= 1.4.0 =

* New: The seoslides importer now presents a progress bar to keep track of ongoing imports.
* New: Slide imports are now processed in parallel to enhance the speed of the importer.
* New: Add a flexible footer bar to all presentations to allow easy social sharing and access to embeds & notes.
* New: Add open graph tags for Facebook, Twitter, and Google+ data elements when sharing a slide URL on social networks.
* New: Add the 'minimal-ui' tag to the viewport tag for mobile optimization.
* Fix: Synchronize the animations of navigation elements and the footer.
* Fix: Remove a bug where not changing the slide background while updating elements would reset it to the default.
* Fix: Updated product key logic to allow bulk updating.
* Fix: Don't remove the api key upon failed validation.

= 1.3.2 =

* Fix: Remove scrollbars on embeds.

= 1.3.1 =

* Fix: Strip spaces from the end of image URLs so they display properly as embedded media.
* Fix: Re-enable styles removed during the 1.3.0 upgrade.

= 1.3.0 =

* New: Slide titles on the presentation edit page now launch the slide editor.
* New: Add presentation count to the At a Glance dashboard widget for easy access.
* Fix: Don't load theme scripts or the WP admin bar since we aren't using them (enhances performance).
* Fix: Add Deck JS as a Git subtree so we can track its progress as well and avoid hacking vendor files.
* Fix: Correct a taxonomy query conflict with Meta Slider.

= 1.2.4 =

* New: Add a busy spinner when saving slides.
* Fix: Update the target slide row before closing the modal window.
* Fix: Remove an erroneous "are you sure" notice when saving the Slide Master.
* Fix: Update the preview of the Slide Master upon saving the modal.
* Fix: Fix label typo where a closing parentheses was missing.
* Fix: Remove PressTrends bloat since the feature never worked in the first place.

= 1.2.3 =

* Add an optional Product Key to the settings page for initial integrations with Easy Digital Downloads.

= 1.2.2 =

* Allow imported slides to "inherit" the background of the default/master slide rather than be set individually.
* Remove the CSS Customizer since it's not necessary and causing a few problems.
* Fix a minor PHP notice that was interfering with Jetpack-delivered images.
* Auto-number slides as they come in via the importer.

= 1.2.1 =

* Prevent loss of changes by prematurely closing the modal slide editor.
* Fix a focus issue that caused opening the embed overlay to disable keyboard navigation.
* Allow editors to hide imported backgrounds from the media library - only applies to _new_ imports.

= 1.2 =

* Fix an issue where child theme stylesheets were not unenqueued on slideset pages.
* Fix thumbnails on the presentation editor.
* Fix a compatibility issue with the Genesis theme framework.
* Streamline the Backlink editor modal.
* Simplified importer page.
* Update the presentation editor to make things more intuitive - Slide Master is a title, excerpt presenter notes, etc.
* Update the presentation and slide list views to use thumbnail images for backgrounds to optimize performance.
* Update front-end branding to be disabled by default. You can purchase a Pro package from https://seoslides.com to enable front-end white label branding.
* Update the iframe background to match the slidemaster background.
* Add multiple transition options to the Slide Master dialog.
* Add optional slide to end of presentation with sharing and embedding options.
* Future-proof admin styles such that seoslides is compatible with WordPress 3.7, 3.7 with MP6, and 3.8.

= 1.1.1 =

* Fix PHP 5.2 compatibility.

= 1.1 =
* Fix scrollbars on long slide notes.
* Fix CSS Customizer for power users.
* Fix slashed double/single quotes on titles in the Slide list.
* Fix inserted image elements' aspect ratio so it doesn't force a 1:1 setting.
* Improve front-end performance by auto-loading background image and widgets on the first slide.
* Update sign-up links to match new site structure.
* Update Backstretch library to latest version and fix some aspect ratio conflicts.
* Update the logo to 50% smaller than original size on slides
* Add PressTrends Support.
* Add JetPack CDN Support for background images.
* Add Photon dynamic resizing for background images, where available.

= 1.0.5 =

* Fix PHP 5.2 compatibility.

= 1.0.4 =

* Add a default first slide when creating a new presentation.
* Add a default presentation when first installing the plugin.
* Add a warning before navigating away from the importer page.
* Improve the support form by pre-populating the site url.
* Improved plugin iconography and images for consistency and MP6 compatibility.
* Improve error messages.
* Improve YouTube/Vimeo URL validator.
* Improve help text for embed backlink and post embeds.
* Fix modal media overlay conflict with MP6.

= 1.0.3 =

* Fix a conflict with CloudFlare's RocketLoader.
* Improve the cache busting functionality of the PDF importer so false negatives disappear.
* Improve visual indications that a Vimeo/YouTube URL is valid or invalid.
* Improve the static HTML delivered by per-slide requests for SEO purposes.
* Improve seoslid.es descriptions and notifications.
* Improve language on importer page.

= 1.0.2 =

* Hide the WordPress.com stats smiley graphic.

= 1.0.1 =

* Fix minor code mismatch when validating license keys.

= 1.0 =

* First plugin release

= 0.1.0 =

* Initial alpha version

== Licensing ==

This plugin uses icons from the GNOME Desktop icon pack (http://commons.wikimedia.org/wiki/GNOME_Desktop_icons), licensed as GPLv2.