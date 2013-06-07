<!DOCTYPE html>
<?php
        include("simple_html_dom.php");
        $id = $_POST["id"];
        $content = $_POST["content"];
	$file = __FILE__;
	//deactivated by default
        if (false && $id != "" && $content != "") {
                // Create DOM from URL or file
                $html = file_get_html($file, false, null, -1, -1, true, true, DEFAULT_TARGET_CHARSET, false);
		//replace content of matching dom object
                foreach($html->find('#'.$id) as $element) {
                       $element->innertext = $content;
                }
                $html->save($file);
        }
?>
<html>
<head>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<title>Saving with Aloha Editor</title>
	<link rel="stylesheet" href="index.css" type="text/css" />
	<link rel="stylesheet" href="../../css/aloha.css" type="text/css" />
	<script src="../../lib/require.js"></script>
	<script src="../../lib/vendor/jquery-1.7.2.js"></script>
	<script src="../../lib/aloha.js" data-aloha-plugins="common/ui,common/format,common/highlighteditables,common/link"></script>
</head>
<body>
	<div id="main">
		<div id="status"><a href="#">save</a></div>
		<div id="title"><h1>Saving with Aloha!</h1></div>
		<div id="content">
			<p>This demo also stores the content on the server.</p>
			<p><b>Attention:</b> By default the save function is deactivated to not be a security risk for any servers. To activate open index.php in your favourite editor and change:</p>
			<pre>//deactivated by default
if (false &amp;&amp; $id != "" &amp;&amp; $content != "") {</pre>
			<p>to:</p>
			<pre>if ($id != "" &amp;&amp; $content != "") {</pre>
			<p>So just remove the false that is preventing the save function to work.</p>
		</div>
	</div>
	<script type="text/javascript">
                Aloha.require(['aloha', 'aloha/jquery'], function(Aloha, $){
                        'use strict';
                        $('#content').aloha();
			$('#title').aloha();
			
			function save(id, content) {
				var status = $('#status')
				status.find('a').text("saving");
				var request = $.ajax({
                                        url: document.location.url,
                                        type: "post",
                                        data: {
                                                'content': content,
                                                'id': id
                                        }
					
				});
				request.done(function(msg){
					status.find('a').text("saved");
					if (status.hasClass('error')) {
						status.removeClass('error');	
					}
				});
				request.fail(function(msg){
					status.find('a').text("not saved");
					if(!status.hasClass('error')) {
						status.addClass('error');
					}
					console.error('Error saving the content', msg);
				});
			}

                        Aloha.bind('aloha-smart-content-changed', function(event,data){
                                var content = data.editable.getContents();
                                var id = data.editable.getId();
				save(id, content);
                        });
			Aloha.bind('aloha-editable-created', function(event, data) {
				$('#status a').click(function() {
					var id = data.obj.attr('id');
					var content = $('#' + id).html();
					save(id, content);						
				});
			});
                });
	</script>
</body>
</html>
