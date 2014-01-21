<?php
	ini_set('session.gc_maxlifetime', 172800);
	session_start();

	class login
	{
		private $db_ops;

		public function __construct($db_ops) {
			$this->db_ops = $db_ops;
		}

		public function userLogin($username, $password) {
			$query = "SELECT * FROM users WHERE username = '" . $username . "'";
			$result = $this->db_ops->getResults($query);
			if(gettype($result)=='array'&&sizeof($result)>0) {
				if(strcmp($result[0]['password'], md5($password)) == 0) {
					$randomString = $this->randomNumber();
					$digest = md5($username . $randomString);
					$query = "INSERT INTO current_session VALUES ('" . $username . "', '" . $digest . "')";
					$this->db_ops->executeQuery($query);
					$_SESSION['session_key'] = $randomString;
					$response = array('username'=>$username, 'session'=>$digest);
				}
				else
					$response = array('username'=>$username, 'session'=>'');
			}
			else
				$response = array('username'=>'', 'session'=>'');

			return $response;
		}

		private function randomNumber() {
			$string = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM<>?:[]\{}|!@#$%^&*()_+-=';
			$stringArray = str_split($string);

			$randomString = '';
			$length = sizeof($stringArray);

			for($i=0; $i<12; $i++) {
				$randomString .= $stringArray[rand(0, ($length-1))];
			}

			return $randomString;
		}

		public function destroySession($username, $sessionVar) {
			$query = "DELETE FROM current_session WHERE session_var = '" . $sessionVar . "' AND username = '" . $username . "';";
			$result = $this->db_ops->executeQuery($query);

			if($result == 1) {
				unset($_SESSION['session_key']);
				$response = 1;
			}
			else {
				$response = 0;
			}

			return $response;
		}
	}
?>