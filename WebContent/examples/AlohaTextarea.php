<?
	# Stripslashes with support for Arrays
	function stripslashes_deep ( $value ) {
		// Originally from BalPHP {@link http://www.balupton/projects/balphp}
		// Authorised by Benjamin Arthur Lupton {@link http://www.balupton.com/} (the copyright holder)
		// for use and license under the Aloha Editor Contributors Agreement
		$value = is_array($value) ? array_map('stripslashes_deep', $value) : stripslashes($value);
		return $value;
	}
	
	# Normalises Magic Quotes
	function fix_magic_quotes ( ) {
		// Originally from BalPHP {@link http://www.balupton/projects/balphp}
		// Authorised by Benjamin Arthur Lupton {@link http://www.balupton.com/} (the copyright holder)
		// for use and license under the Aloha Editor Contributors Agreement
		if ( ini_get('magic_quotes_gpc') ) {
			$_POST = array_map('stripslashes_deep', $_POST);
			$_GET = array_map('stripslashes_deep', $_GET);
			$_COOKIE = array_map('stripslashes_deep', $_COOKIE);
			$_REQUEST = array_map('stripslashes_deep', $_REQUEST);
			ini_set('magic_quotes_gpc', 0);
		}
	}
	
	# Fix the magic quotes
	fix_magic_quotes();
	
?><!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<title>
			Aloha, Documents!
		</title>
		
		<script type="text/javascript">
			GENTICS_Aloha_base="../";
		</script>
		<script type="text/javascript" src="../core/include.js"></script>
		<script type="text/javascript" src="../plugins/com.gentics.aloha.plugins.Format/plugin.js"></script>
		<script type="text/javascript" src="../plugins/com.gentics.aloha.plugins.Table/plugin.js"></script>
		<script type="text/javascript" src="../plugins/com.gentics.aloha.plugins.List/plugin.js"></script>
		<script type="text/javascript" src="../plugins/com.gentics.aloha.plugins.Link/plugin.js"></script>
		<link rel="stylesheet" href="AlohaDocument.css" type="text/css">
		
		<!-- turn an element into editable Aloha continuous text -->
		<script type="text/javascript">
			GENTICS.Aloha.settings = {
				logLevels: {'error': true, 'warn': true, 'info': true, 'debug': true},
				errorhandling: false,
				ribbon: false
			};
			$(function(){
				$('#content').aloha();
			}); 
		</script>
	</head>
	<body>
		<div id="main">
			<div id="bodyContent">
				<form id="form" method="POST" action="">
					<textarea id="content" class="article" name="content">
						<? if ( !empty($_POST['content']) ) : ?>
							<? echo $_POST['content'] ?>
						<? else: ?>
							<h1>
								Aloha
							</h1>
							<h2>
								Etymology
							</h2>
							<p>
								The word <a href="http://en.wikipedia.org/wiki/Aloha" target="_blank" class="external">aloha</a> derives from the Proto-Polynesian root <i>*qalofa</i>. It has cognates in other Polynesian languages, such as Samoan alofa and Māori aroha, also meaning "love."
							</p>
							<p>
								<a href="http://aloha-editor.com/">Aloha Editor</a> is the word's most advanced browser based Editor made with aloha passion.
							</p>
							<p>
								A folk etymology claims that it derives from a compound of the <a href="http://en.wikipedia.org/wiki/Hawaii" target="_blank" class="external">Hawaiian</a> words alo meaning "presence", "front", "face", or "share"; and ha, meaning "breath of life" or "essence of life." Although alo does indeed mean "presence" etc., the word for breath is spelled with a macron or kahakō over the a (hā) whereas the word aloha does not have a long a.
							</p>
							<h2>
								Usage
							</h2>
							<p>
								Before contact with the West, the words used for greeting were welina and anoai. Today, "aloha kakahiaka" is the phrase for "good morning." "Aloha ʻauinalā" means "good afternoon" and "aloha ahiahi" means "good evening." "Aloha kākou" is a common form of "welcome to all."
							</p>
							<p>
								In modern Hawaiʻi, numerous businesses have aloha in their names, with more than 3 pages of listings in the Oʻahu phone book alone.
							</p>
							<h2>
								Trends
							</h2>
							<p>
								Recent trends are popularizing the term elsewhere in the United States. Popular entertainer, Broadway star and Hollywood actress Bette Midler, born in Honolulu, uses the greeting frequently in national appearances. The word was also used frequently in the hit television drama Hawaii Five-O. In the influential 1982 film comedy Fast Times at Ridgemont High, the eccentric teacher Mr. Hand makes use of the greeting. The Aloha Spirit is a major concept in Lilo and Stitch, a very popular Disney series of movies and TV shows, set in Hawaiʻi. The drama series Lost, shot in Hawaiʻi, has a thank you note at the end of the credits saying "We thank the people of Hawaiʻi and their Aloha Spirit". Aloha is a term also used in the Nickelodeon program Rocket Power.
							</p>
							<ul>
								<li>Arguably the most famous historical Hawaiian song, "Aloha ʻOe" was written by the last queen of Hawaii, Liliʻuokalani.
								</li>
								<li>The term inspired the name of the ALOHA Protocol introduced in the 1970s by the University of Hawaii.
								</li>
								<li>In Hawaii someone can be said to have or show aloha in the way they treat others; whether family, friend, neighbor or stranger.
								</li>
							</ul>
						<? endif; ?>
					</textarea>
					<input type="submit" value="Update Textarea"/>
				</form>
			</div>
		</div>
	</body>
</html>
