## Testing

#### Content Handler

1. Create a .docx file with the following text:
   1. A "Title" text with Title format and any Font (i.e. Algerian)
   2. A "Subtitle" text with Subtitle format
   3. A "Heading 1" text with Heading 1 and <strong>bold</strong> format
   4. A "Heading 2" text with Heading 2 and <em>italic</em> format
   5. A "Heading 3" text with Heading 3 format
   6. A "Heading 4" text with Heading 4 format
   7. A "Heading 5" text with Heading 5 format
   8. Five items in an unordered list
   9. Five items in an ordered list
<br>
2. Create an html file with the following plugins:
   1. common/contenthandler
   2. common/paste
<br>
3. Paste the following code in the html's script:
<br>
    > Aloha.settings.contentHandler = {
    insertHtml: [ 'word', 'generic', 'oembed', 'sanitize' ],
    initEditable: [ 'sanitize' ],
    getContents: [ 'blockelement', 'sanitize', 'basic' ],
    sanitize: 'relaxed', // relaxed, restricted, basic,
    allows: {
        elements: [
            'strong', 'em', 'i', 'b', 'blockquote', 'br', 'cite', 'code', 'dd', 'div', 'dl', 'dt', 'em',
            'i', 'li', 'ol', 'p', 'pre', 'q', 'small', 'strike', 'sub',
            'sup', 'u', 'ul'],        
        attributes: {
            'a'         : ['href'],
            'blockquote': ['cite'],
            'q'         : ['cite']
         },
        protocols: {
            'a'         : {'href': ['ftp', 'http', 'https', 'mailto', '__relative__']}, // Sanitize.RELATIVE
            'blockquote': {'cite': ['http', 'https', '__relative__']},
            'q'         : {'cite': ['http', 'https', '__relative__']}
        }
    },
    handler: {
        generic: {
            // this will disable the transformFormattings method in the generic content handler
            transformFormattings: false,
            // settings this configuration properteis will
            // enable conversion of copyied elements to specified elements in the clipboard
            // this can be used to counter Chrome's copy&paste bug on styled elements
            transformFormattingsMapping: [
                // this will make sure a copied b element will be be pasted again as a b element
                // Chrome would try to change it to a span with a style attribute of 'font-weight: 700'
                //
                // Note: the attributes to check for are dependent on the style applied to the copied element.
                // for example to detect sup and sub elemenst it is suggested to add detectable font-size values (75% and 75.01%)
                {
                    nodeNameIs: 'span',
                    nodeNameShould: 'b',
                    attribute: {
                        name: 'style',
                        value: 'font-weight: 700' 
                    }
                },
                {
                    nodeNameIs: 'span',
                    nodeNameShould: 'sup',
                    attribute: {
                        name: 'style',
                        value: 'font-size: 12.6px'
                    }
                }
            ]
        },
        sanitize: {
            '.aloha-captioned-image-caption': { elements: [ 'em', 'strong' ] }
        }
    }
} `
<br>
4. Copy the whole text from Word and Paste it within an editable block in the page
<br>
5. Check the following:
   1. Title should be an `<h1>` element and have no `font-family style` nor `mso-ansi-language style`
   2. Subtitle should be an `<h2>` element
   3. Each heading should be an `<h1-h5>` element respectively
   4. Heading 1 should have a `<b>` tag
   5. Heading 2 should have an `<i>` tag
   6. Each unordered list item should be a `<li>` element inside a `<ul>` element"
   7. Each ordered list item should be a `<li>` element inside an `<ol>` element"