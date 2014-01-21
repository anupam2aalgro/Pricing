<?php
	require_once('settings.php');
	require_once('db.php');
	session_start();
	class validateSession
	{
		private $db_ops;

		public function __construct() {
			$this->db_ops = new db_ops(HOST, USERNAME, PASSWORD, DB);
		}

		public function validateCurrentSession($username, $session) {
			$digest = md5(htmlspecialchars($username, ENT_QUOTES) . $_SESSION['session_key']);
			try {
				if(strcmp($digest, $session) == 0) {
					$query = "SELECT * FROM current_session WHERE username = '" . htmlspecialchars($username, ENT_QUOTES) . "' AND session_var = '" . $digest . "'";
					$result = $this->db_ops->getResults($query);

					if(sizeof($result)>0) {
						$response = 1;
					}
					else
						$response = 0;
				}
				else {
					$response = 0;
				}
			}

			catch(My_Exception $e) {
				echo json_encode(array('error' => 1, 'code' => $e->getCode(), 'message' => $e->ErrorMessage($e->getCode())));
				exit();
			}

			return $response;
		}
	}
?>