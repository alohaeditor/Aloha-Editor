<?php

    /*=========== DEPENDENCIES ===========*/

    //load server configs
    require_once("../configs/configs.php");

    //get the controllerList
    require_once("../controller/controllerList.php");

    //get the api class
    require_once("RequestAPI.php");

    //create the req class
    require_once("Req.php");

    //create the response class
    require_once("Res.php");


    /*============PRIVATE VARIABLES ============*/

    $patterns = array("/\<\?php/", "/\?\>/");


    /*=========== NOW WE CAN START THE WORKFLOW ===========*/

    //first we need to namespace each of the existing controllers
    foreach ($controllerList as $pluginName => $pluginControllers) {

        foreach($pluginControllers as $pluginController){

            $controllerCode = file_get_contents("../controller/".$pluginName."/".$pluginController."/controller.php");
            $controllerCodeClean = preg_replace($patterns, "", $controllerCode);

            //the use of php namespaces is why this plugin will only work on php 5.3+
            $startNamespace =   "namespace ".$pluginName."_".$pluginController." {";
            $php_code =             $controllerCodeClean;
            $endNamespace =     "}";

            $namespaceCreation = $startNamespace . $php_code . $endNamespace;

            //dynamically create the namespace because all controllers will be class "controller"
            eval($namespaceCreation);
        }
    }

    //create a Req object
    $req = new Req($_SERVER['REQUEST_URI']);

    //get an api object
    $api = new RequestAPI();

    //get a response object
    $res = new Res();

    $controllerConfigs = $configs[$req->pluginName];

    //create the controller
    eval("\$controller = new ".$req->pluginName."_".$req->pluginController."\Controller(\$req, \$res, \$api, \$controllerConfigs);");

    $controllerResponse = $controller->getResponse();

    //pass back the response
    echo $controllerResponse;

?>