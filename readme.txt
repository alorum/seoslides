=== seoslides ===
Contributors: alorum, 10up
Donate link: http://alorum.com
Tags: presentation, seoslides, seo slides, seo, slide, slides, slide deck, search engine optimization, search engine, slideshow, bing, canonical, description, google, keywords, meta, meta description, meta keywords, wordpress seo, yahoo, alorum, 10up
Requires at least: 3.5.1
Tested up to: 3.8.1
Stable tag: 1.3.2
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Add embeddable presentations to WordPress

== Description ==

WordPress: Pages, Posts and {now} Presentations

**Why add presentations?**

 - **Get started.** For the first time ever on WordPress, import your presentation, display in an embeddable player on your site, and in-plugin support.
 - **Get content.** Writer’s block is a bloggers worst enemy, especially when writing one page at a time. Turn one concept into multiple pages with presentations.
 - **Get noticed.** Presentations on your site are unexpected. Guaranteed to make you, your content, and your clients’ content stick out. Be a hit at WordCamp.
 - **Get embedded.** Presentations are fully embeddable. Slides contain your images, text and video – no matter where hosted. Own and control your distribution.
 - **Get linked.** Presentations contain fully customizable bylines. Link to your squeeze page from your viral conference keynote. Manage your lead pipeline.

**How can you and your clients use it? **

 - **Presenters:** Add fully-embeddable presentations to your posts and pages, then anywhere else using a slide-specific (meaning that slide will show up first) code.
 - **Marketers:** Every slide in your presentation is a SEO-optimizable page with unique and customizable URL backlinks
 - **Conferences:** Archive embeddable versions of every one of your presenter’s decks with a simple upload from a PDF deck
 - **Agencies:** Give your clients a unique way to build fast, easy, marketing-driven content
 - **Designers:** Import directly from PDF, or embed images and videos, for a stunning full-screen slide display

**Incredible features: **

 - **WordPress 1st!** HTML5 canvas-based editor
 - **WordPress 1st!** Presentation player powered by WordPress
 - **WordPress 1st!** Turn WordPress into an embeddable widget builder
 - **WordPress 1st!** Multi-page content and engagement
 - **WordPress 1st!** Import your PDF presentation, quickly add SEO-optimizable slide notes
 - **WordPress 1st!** Choose your own backlink
 - **WordPress 1st!** One-click embed to seoslid.es presentation sharing community

**Killer additional features: **

 - access free art (backgrounds) & resources
 - unlimited embeds at seoslid.es
 - unlimited imports during beta
 - unlimited branding control (re-skin the presentation player!)
 - priority in-plugin support form
 - priority access to new features
 - a chance to help fund the next phase of this plugin (50+ features & improvements in the backlog)

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

You'll find the FAQ on [https://seoslides.com/faq/](https://seoslides.com/faq/).

== Screenshots ==

1. Full Screen Presentations with HTML or Full Screen Background Images
1. Full Screen Movies Work Too
1. Notes Available for Every Slide
1. WordPress First Canvas Based Editor
1. Notes Editor
1. Presentation Manager
1. Publish to seoslid.es & Control Your Backlinks

== Changelog ==

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