<span style="font-size: 16pt; line-height:1em;  color: rgb(161, 10, 25); font-weight: 700;">StudyHub 2</br> Documentation</span>
---
---
Project Objectives
------------------

*   Centralize study resources and peer help across York School.

*   Increase and encourage sharing across York.

*   Make research easier by organizing data and sources.

*   Remove some of the unnecessary duplication of material between students and grades.

*   Allow younger grades to build upon the work of the grades before them, rather than starting from square zero when appropriate.

*   Make finding quizlets easier by centralizing ones made by Yorkies.


Helpful Development Resources
-----------------------------

[Material Design](https://www.google.com/design/spec/material-design/introduction.html)

[Google Drive API](https://developers.google.com/drive/web/about-sdk)

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

HTML ids: Capitalized words separated by underscores.

Example:  <<span style=" color: rgb(241, 194, 50);">img</span> <span style=" color: rgb(147, 196, 125);">id=”</span><span style="font-weight: 700;">Example_Id</span><span style=" color: rgb(147, 196, 125);">”</span> />

CSS classes:</span> lowercase words separated by dashes.</span>

Example:  <<span style=" color: rgb(241, 194, 50);">img</span> <span style=" color: rgb(106, 168, 79);">class=”</span><span style="font-weight: 700;">example-class</span><span style=" color: rgb(147, 196, 125);">”</span> />

JS variables:</span> camelCase with first word NOT capitalized.</span>

Example:  </span><span style=" color: rgb(103, 78, 167);">var</span> <span style="font-weight: 700;">exampleVariable</span> <span style=" ">=</span> <span style=" color: rgb(166, 77, 121);">null</span>;

JS functions:</span> camelCase with first word NOT capitalized.</span>

Example:  </span><span style=" color: rgb(60, 120, 216);">function</span> <span style="font-weight: 700;">exampleFunction</span> <span style=" ">()</span>

JS object properties:</span> camelCase with first word NOT capitalized.</span>

Example:  {</span> <span style="font-weight: 700;">exampleProperty</span> <span style=" ">:</span> <span style=" color: rgb(166, 77, 121);">null</span> <span style=" ">}</span>

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