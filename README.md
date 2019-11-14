# API Errors Simulator Chrome Extension

## Overview
The API Errors Simulator Chrome Extension allows you to simulate backend API errors in order to test how your application handle errors.

Generally, if you want to test how frontend behaves when backend API returns 4xx or 5xx error codes, there are two options:
- If you control the backend, you can patch your backend code and manually return 4xx/5xx error codes from API methods.
- If you don't control the backend, you can patch your frontend code with some debug statements to verify the behavior.

Neither of which is an elegant approach.

The API Errors Simulator Chrome Extension allows you to map backend API endpoints to the error codes you want to simulate for your application. Internally it patches browser's XMLHttpRequest API with the error codes supplied in the options page.

Once you've installed the extension, follow the steps to operate it:
- Click on the ! icon at right top of the browser and switch on the extension.
- Click on the OPTIONS button. It'll open a page where you can supply rules with:
  - The combination of URL and HTTP verb
  - The response error code
- You can also edit/delete your rules

## Design Credit
Huge shout out to [Jainul Abedin](https://www.linkedin.com/in/jainul-abedin-4148b816) for designing the icons and options page.
