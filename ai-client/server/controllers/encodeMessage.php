<?php
// encodeMessage.php

// Accept the message as a command-line argument
$message = $argv[1]; // Message passed from Node.js

// Perform iconv encoding from UTF-8 to UCS-2BE
$encodedMessage = iconv("UTF-8", "UCS-2BE", $message);

// Perform URL encoding on the UCS-2BE encoded message
$urlEncodedMessage = urlencode($encodedMessage);

// Output the URL-encoded UCS-2BE message
echo $urlEncodedMessage;
?>
