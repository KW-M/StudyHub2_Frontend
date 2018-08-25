StudyHub 2<br> Documentation (WIP)
---------
Project Objectives
------------------

*   Centralize study resources and pe er help across York School.

*   Increase and encourage sharing across York.

*   Make research easier by organizing data and sources.

*   Remove some of the unnecessary duplication of material between students and grades.

*   Allow younger grades to build upon the work of the grades before them, rather than starting from square zero when appropriate.

*   Make finding quizlets easier by centralizing ones made by Yorkies.


Helpful Development Resources
-----------------------------

[Material Design](https://www.google.com/design/spec/material-design/introduction.html)

[Angular Docs](https://angular.io/docs)

[Firebase Docs](https://firebase.google.com/docs/reference/js/)

[Google Signin & API Docs](https://developers.google.com/api-client-library/javascript/reference/referencedocs)

[Google Drive API](https://developers.google.com/drive/web/about-sdk) & [APIS Explorer](https://developers.google.com/apis-explorer/)

Plugins and Frameworks
----------------------
For most up-to-date list see: [package.json](https://github.com/KW-M/StudyHub2_Frontend/blob/master/package.json)

<\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\- Logic (Javascript) ------------------->

[Angular 6](https://angular.io/) -> For data binding, organisation and lots of other stuff.

[Angular Material 2](https://material.angular.io/) -> for most of the Material Design elements and styling.

[Firebase Client](https://firebase.google.com/docs/web/setup) -> for connecting with the Firebase databases and services.

[AngularFire 2](https://github.com/angular/angularfire2/) -> Makes firebase js more Angular friendly.


<\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\- Style & Layout ------------------->

[Angular Material 2](https://material.angular.io/)

[Material Icons Font](https://design.google.com/icons/)

[Google Web Fonts](https://www.google.com/fonts) (Roboto).

Conventions
-----------

HTML ids: Capitalized words separated by underscores. Example:  
```HTML
<img id=”Example_Id” />
```

CSS classes: lowercase words separated by dashes. Example:
```HTML
<img class=”example-class” />
```

JS variables: camelCase with first word NOT capitalized. Example:  
```javascript
exampleVariable = null;
```
JS functions: camelCase with first word NOT capitalized. Example:  
```javascript
function exampleFunction()
```
JS object properties: camelCase with first word NOT capitalized. Example:
```javascript
 { exampleProperty: null}
```
Data Formats
------------

#### Post JSON Format:

\[

{

"Title" : "English Notes for chapter 3",

"Creator" : {

"Name":"Bob Johnson",

"Email":"bobj2020@york.org",

"ClassOf" :  2020

},

"CreationDate" : date formated creation date and time.

"UpdateDate" : date formatted Update date & time.

"Labels" : \[An optional array of string labels including teacher and other tags/identifiers\],

"Description" : "The post's description, may contain formatting html that will be rendered",

"Class" : {

"Name":"Name Of Class",

“Category”:”category”

Color: “rgb(0,0,0) or hex”

},

"Link" : "If present, the link to the resource of the post",

"FileId": "If present, the file id of the Google Drive file for that post",

"LikeUsers" :  \[“elanf2015@york.org”, “samt2019@york.org”\],

}

\]