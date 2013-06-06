<!DOCTYPE html>
<?php
        include("simple_html_dom.php");
        $id = $_POST["id"];
        $content = $_POST["content"];
	$file = __FILE__;
        if ($id != "" && $content != "") {
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
		<div id="content"><h2>Getting started with Aloha Editor! </h2><p>This demo also stores the content on the server.</p></div>
	</div>
	<script type="text/javascript">
                Aloha.require(['aloha', 'aloha/jquery'], function(Aloha, $){
                        'use strict';
                        $('#content').aloha();

                        Aloha.bind('aloha-smart-content-changed', function(event,data){
                                var content = data.editable.getContents();
                                var id = data.editable.getId();
                                var request = $.ajax({
                                        url: document.location.url,
                                        type: "post",
                                        data: {
                                                'content': content,
                                                'id': id
                                        }
                                });
                        });
                });
	</script>
</body>
</html>
