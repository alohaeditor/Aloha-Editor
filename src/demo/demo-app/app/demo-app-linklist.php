<?php
/**
* provide aloha link suggestion
*/

/*
// also possible: use the lookup filter here to not send a json with 10000s of entries
$lookup = false;
if (isset($_REQUEST['lookup'])) {
	$lookup = $_REQUEST['lookup'];
}
*/

// read all available files
$results = array();

// all pages
$files = get_files( '../' );
$results = array_merge($results, $files);


// all uploads
$files = get_files( '../uploads/' );
$results = array_merge($results, $files);


header('Content-Type:text/javascript');
if (count($results) > 0) {
	$out = '[';
	foreach ($results as $result) {
		$out .= '{"url":"'.$result['link'].'","name":"'.$result['title'].'","type":"'.$result['type'].'"},';
	}
	$out = substr($out, 0, -1);
	$out .= ']';
	echo $out;
}


/**
 * helper functions
*/
function get_files( $dir = '../', $dir_path = false) { 
	$files = scandir( $dir ); 
	$result = array();
	
	if ( empty($dir_path) ) {
		$dir_path = substr($dir, 1, 0);
	}
	
	foreach ( $files as $file )  {
		$data = false;
		
		if ( $file === '.' || $file === '..' ) { 
			continue; 
		} else if (is_file($dir.$file)) { 
			$data['link'] = $dir_path.$file;
			$data['title'] = nice_file_title($file); // read title from html, image/auto meta data ...
			$data['type'] = 'website'; // check what type the file is -- now just use 'website'
			array_push($result, $data);
		} 
	}

	return $result; 
}

function nice_file_title($title) {
	$ext = pathinfo($title, PATHINFO_EXTENSION);
	
	$search = array("-", "_", "+", ".".$ext);
	$title = trim(str_replace($search, " ", $title));
	
	$title = $title.' ('.strtolower($ext).')';
	
	return $title;
}