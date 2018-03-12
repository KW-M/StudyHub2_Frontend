// import {UrlSerializer, UrlTree, DefaultUrlSerializer} from '@angular/router';

// export class CustomUrlSerializer implements UrlSerializer {
//     parse(url: any): UrlTree {
//         let dus = new DefaultUrlSerializer();
//         // parse the url like usual;
//         return dus.parse(url.replace(/-/g,'%20').replace(/~/g,'-'));
//     }
//     serialize(tree: UrlTree): any {
//         let dus = new DefaultUrlSerializer(),
//             path = dus.serialize(tree);
//         // Use the default serializer to create a url and replace any spaces with + signs
//         return path.replace(/%20/g,'-').replace(/-/g,'~');
//     }
// }