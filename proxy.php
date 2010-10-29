<?php
/**
 * Gentics Aloha Editor AJAX Gateway
 * Copyright (c) 2010 Gentics Software GmbH
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 * aloha-sales@gentics.com
 * Author Haymo Meran h.meran@gentics.com
 * Author Johannes Schüth j.schuett@gentics.com
 * Authot Tobias Steiner t.steiner@gentics.com
 * 
 * Testing from the command line:
 * function getallheaders(){return array('X-Gentics' => 'x');};
 * $url = 'https://google.com/adsense';
 * 
 */

// for debugging
//$_SERVER['SERVER_PROTOCOL'] = 'HTTP/1.0';
$_SERVER['REQUEST_METHOD'] = 'HEAD';
//error_reporting(E_ALL);

function myErrorHandler($errno, $errstr, $errfile, $errline)
{
	// 500 could be missleading... 
	// Should we return a special Error when a proxy error occurs?
	header("HTTP/1.0 500 Internal Error");
	echo "Gentics Aloha Editor AJAX Gateway Error: $errstr, $errline";
	exit();
}
set_error_handler("myErrorHandler");

// read url parameter
if ( array_key_exists('url', $_GET)) {
	$url = urldecode($_GET['url']);
} else {
	header("HTTP/1.0 400 Bad Request");
	echo "Gentics AJAX Gateway failed because parameter url is missing.";
	exit();
}

$protocol = $_SERVER['SERVER_PROTOCOL'];
$method   = $_SERVER['REQUEST_METHOD'];

// check if link exists
$res = proxy_request($url, $method, $protocol);

// Note HEAD does not always work even if specified...
// We use HEAD for Linkchecking so we do a 2nd request.
if (strtoupper($method) == 'HEAD' && (int)$res['status'] >= 400 ) {
	$res = proxy_request($url, 'GET', $protocol, 5, true);
}

// forward each returned header...
foreach ($res['headers'] as $header) {
	if (trim($header)) {
		$h = explode(':', $header);
		// Don't send Transfer-Encoding: handled by this server...
		if ( strtolower($h[0]) != 'transfer-encoding' ) {
			header($header);
		}
	}
}

// output body
echo $res['body'];

// request method always HTTP/1.0 because we never keep-alive.
function proxy_request($url, $method, $protocol = 'HTTP/1.1', $timeout = 5, $header_only = false) {

	// Extract the hostname from url
	$parts = parse_url($url);
	if ( !array_key_exists('host', $parts) ) {
		return trigger_error("url ($url) has no host. Is it relative?", E_USER_ERROR);
	} else {
		$remote = $parts['host'];
	}
	if (array_key_exists('port', $parts)) {
		$port = $parts['port'];
	} else {
		$port = 0;
	}
	$request_headers = "";
	
	// Beware that RFC2616 (HTTP/1.1) defines header fields as case-insensitive entities.
	foreach (getallheaders() as $name => $value) {
		switch (strtolower($name)) {
		//ommit some headers
		case "keep-alive":
		case "connection":
			break;
		// correct the host parameter
		case "host":
			$request_headers .= "$name: $remote\r\n";
			break;
		// add all other headers to the answer
		default:
			$request_headers .= "$name: $value\r\n";
			break;
		}
	}

	$scheme = strtolower($parts['scheme']);

	//set fsockopen scheme (only documented for ssl), and the default port
	switch ($scheme) {
	case 'https':
		$scheme = 'ssl://';
		if ( !$port ) $port = 443;
		break;
	case 'http':
		$scheme = '';
		if ( !$port ) $port = 80;
		break;
	default:
		//keep the unknown scheme and null port. maybe some PHP magic
		//will do the right thing http://php.net/manual/en/transports.inet.php
		$scheme = $scheme . '://';
		if ( !$port ) {
			return trigger_error("Unknown scheme ($scheme) and no port.", E_USER_ERROR);
		}
		break;
	}

	$sock = fsockopen("$scheme$remote", $port, $errno, $errstr, $timeout);

	if ( ! $sock) {
		return trigger_error("Unable to open URL ($url): $errstr", E_USER_ERROR);
	}

	//timeout in fsockopen is only for the connection, the following is
	//for reading the content
	stream_set_timeout($sock, $timeout);

	//host should only be specified for proxy requests
	$relative_part = '/';
	if (array_key_exists('path', $parts))     $relative_part  = $parts['path'];
	if (array_key_exists('query', $parts))    $relative_part .= '?' . $parts['query'];
	if (array_key_exists('fragment', $parts)) $relative_part .= '#' . $parts['fragment'];

	$out = "$method $relative_part $protocol\r\n"
	     . $request_headers
         . "Connection: Close\r\n\r\n";
	fwrite($sock, $out);

	//possibly use $HTTP_RAW_POST_DATA if available
	$post_data = http_build_query($_POST);
	fwrite($sock, $post_data);

	$headers = array();
    while (!feof($sock)) {
		$header = trim(fgets($sock));
		if ($header == "") {
			break;
		}
		$headers[] = $header;
	}

	// read content if not set header_only
	if ( !$header_only ) {
		$body = stream_get_contents($sock);
	}

	fclose($sock);

	// get http status
	preg_match('|HTTP/\d\.\d\s+(\d+)\s+.*|i',$headers[0],$match);
	$status = $match[1];

	return Array('headers'=>$headers, 'body'=>$body, 'status'=>$status);
}

//EOF

?>