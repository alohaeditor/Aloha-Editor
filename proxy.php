<?php
/**
 * Gentics Aloha Editor AJAX Gateway
 * Copyright (c) 2010 Gentics Software GmbH
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 * aloha-sales@gentics.com
 * Author Haymo Meran h.meran@gentics.com
 * Author Johannes Schüth j.schuet@gentics.com
 * Author Tobias Steiner t.steiner@gentics.com
 * 
 * Testing from the command line:
 * function getallheaders(){return array('X-Gentics' => 'X');};
 * https url example: https://google.com/adsense
 * 
 */

// for debugging
//$_SERVER['SERVER_PROTOCOL'] = 'HTTP/1.0';
//$_SERVER['REQUEST_METHOD'] = 'HEAD';
//error_reporting(E_ALL);

//error handling can be overriden for easy integration
if ( ! isset($PROXY_HANDLE_ERRORS_OVERRIDE) || ! $PROXY_HANDLE_ERRORS_OVERRIDE ) {
	set_error_handler("myErrorHandler");
}

$request = array(
    'method'   => $_SERVER['REQUEST_METHOD'],
    'protocol' => $_SERVER['SERVER_PROTOCOL'],
    'headers'  => getallheaders(),
	//possibly use $HTTP_RAW_POST_DATA if availa
    'payload'  => http_build_query($_POST),
);

// read url parameter
if (array_key_exists('url', $_GET)) {
	$request['url'] = urldecode($_GET['url']);
} else {
	header("HTTP/1.0 400 Bad Request");
	echo "Gentics AJAX Gateway failed because parameter url is missing.";
	exit();
}

// check if link exists
$response = http_request($request);

// Note HEAD does not always work even if specified...
// We use HEAD for Linkchecking so we do a 2nd request.
if (strtoupper($method) == 'HEAD' && (int)$response['status'] >= 400 ) {

	$request['method'] = 'GET';
	$response = http_request($request);

	//since we handle a HEAD, we don't need to proxy any contents
	fclose($response['socket']);
	$response['socket'] = null;
}

// forward each returned header...
foreach ($response['headers'] as $header) {
	if (trim($header)) {
		header($header);
	}
}

//there is no need to specify a content length since we don't do keep
//alive, and this can cause problems for integration (e.g. gzip output,
//which would change the content length)
header('Content-Length:');

// output the contents if any
if (null !== $response['socket']) {
	fpassthru($response['socket']);
	fclose($response['socket']);
}

exit;

/**
 * Query an HTTP(S) URL with the given request parameters and return the
 * response headers and status code. The socket is returned as well and
 * will point to the begining of the response payload (after all headers
 * have been read), and must be closed with fclose().
 * @param $url the request URL
 * @param $request the request method may optionally be overridden.
 * @param $timeout connection and read timeout in seconds
 */
function http_request($request, $timeout = 5) {

	// Extract the hostname from url
	$parts = parse_url($request['url']);
	if (array_key_exists('host', $parts)) {
		$remote = $parts['host'];
	} else {
		return trigger_error("url ($url) has no host. Is it relative?", E_USER_ERROR);
	}
	if (array_key_exists('port', $parts)) {
		$port = $parts['port'];
	} else {
		$port = 0;
	}

	// Beware that RFC2616 (HTTP/1.1) defines header fields as case-insensitive entities.
	$request_headers = "";
	foreach ($request['headers'] as $name => $value) {
		switch (strtolower($name)) {
		//ommit some headers
		case "keep-alive":
		case "connection":
		case "cookie":
		//TODO: there is some problem with gzip encoded responses. the
		//content-length is OK but some characters are simply read or
		//written incorrectly. This deserves looking into, since this
		//could mean that binary data generally isn't handled correctly.
		case "accept-encoding":
			break;
		// correct the host parameter
		case "host":
			$host_info = $remote;
			if ($port) {
				$host_info .= ':' . $port;
			}
			$request_headers .= "$name: $host_info\r\n";
			break;
		// forward all other headers
		default:
			$request_headers .= "$name: $value\r\n";
			break;
		}
	}

	//set fsockopen transport scheme, and the default port
	switch (strtolower($parts['scheme'])) {
	case 'https':
		$scheme = 'ssl://';
		if ( ! $port ) $port = 443;
		break;
	case 'http':
		$scheme = '';
		if ( ! $port ) $port = 80;
		break;
	default:
		//some other transports are available but not really supported
		//by this script: http://php.net/manual/en/transports.inet.php
		$scheme = $parts['scheme'] . '://';
		if ( ! $port ) {
			return trigger_error("Unknown scheme ($scheme) and no port.", E_USER_ERROR);
		}
		break;
	}

	//we make the request with socket operations since we don't want to
	//depend on the curl extension, and the higher level wrappers don't
	//give us usable error information.
	$sock = fsockopen("$scheme$remote", $port, $errno, $errstr, $timeout);
	if ( ! $sock ) {
		return trigger_error("Unable to open URL ($url): $errstr", E_USER_ERROR);
	}

	//timeout in fsockopen is only for the connection, the following is
	//for reading the content
	stream_set_timeout($sock, $timeout);

	//absolute url should only be specified for proxy requests
	if (array_key_exists('path', $parts)) {
		$path_info  = $parts['path'];
	} else {
		$path_info  = '/';
	}

	if (array_key_exists('query',    $parts)) $path_info .= '?' . $parts['query'];
	if (array_key_exists('fragment', $parts)) $path_info .= '#' . $parts['fragment'];

	$out = $request["method"]." ".$path_info." ".$request["protocol"]."\r\n"
		 . $request_headers
		 . "Connection: Close\r\n\r\n";
	fwrite($sock, $out);
	fwrite($sock, $request['payload']);

	$headers = array();
	while ( ! feof($sock) ) {
		//TODO: a head may span multiple lines
		$header = stream_get_line($sock, 4096, "\r\n");
		if ($header == "") {
			break;
		}
		$headers[] = $header;
	}

	// get http status
	preg_match('|HTTP/\d+\.\d+\s+(\d+)\s+.*|i',$headers[0],$match);
	$status = $match[1];

	return array('headers' => $headers, 'socket' => $sock, 'status' => $status);
}

function myErrorHandler($errno, $errstr, $errfile, $errline)
{
	// 500 could be misleading... 
	// Should we return a special Error when a proxy error occurs?
	header("HTTP/1.0 500 Internal Error");
	echo "Gentics Aloha Editor AJAX Gateway Error: $errstr, $errline";
	exit();
}

//EOF
