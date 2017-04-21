# SearchPlus
It is a chrome extension project in progress. I intend to privide easy and powerful page search functionality and more.

## installation
Download `SearhPlus.crx`, go to the page <chrome://extensions> and drag drop the extension into the page to install. You can change the keyboard shortcuts at the bottom right.
 
## Current Features
* By Default press `Ctrl+Shift+F` to open the extension. By default it is in `nav` mode.
* In `nav` mode, typing letters will only highlight the words in hyperlinks. Use `Enter` and `Shift+Enter` to cycle through the elements and `Ctrl+Enter` to perform a click on the text.
* Press `ESC` in nav mode will change the mode to `nav-esc` mode. Mode letter keys are disabled. Instead, use `hjkl` to navigate the webpage. `Enter`, `Shift+Enter`, `Ctrl+Enter` still work. Press `a` to go back to `nav` mode.
* Type `/multi` then press `Enter` to change mode to multiple matching mode. This mode acts like a multiple keyword matching search.
* `/code` to enter code mode. This mode evaludates javascript within the page. `Shift+Enter` to evaluate the code block. Be careful that dead loops and can freeze chrome.
* `/tab [url]` to visit the page with this url. Please do not include `http://` in the url.
