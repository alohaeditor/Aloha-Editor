if( !Aloha.defaults.sanitize ) {
	Aloha.defaults.sanitize = {}
}

Aloha.defaults.sanitize.basic = {
  elements: [
     'a', 'b', 'blockquote', 'br', 'cite', 'code', 'dd', 'dl', 'dt', 'em',
     'i', 'li', 'ol', 'p', 'pre', 'q', 'small', 'strike', 'strong', 'sub',
     'sup', 'u', 'ul'],

   attributes: {
     'a'         : ['href'],
     'blockquote': ['cite'],
     'q'         : ['cite']
   },

   /*add_attributes: {
     'a': {'rel': 'nofollow'}
   },*/

   protocols: {
     'a'         : {'href': ['ftp', 'http', 'https', 'mailto', '__relative__']},
     'blockquote': {'cite': ['http', 'https', '__relative__']},
     'q'         : {'cite': ['http', 'https', '__relative__']}
   }
}
