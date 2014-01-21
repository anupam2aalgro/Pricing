<?php
	class db_ops
	{
		private static $db_con = NULL;

		public function __construct($host, $username, $password, $db) {
			self::$db_con = @mysqli_connect($host, $username, $password, $db);
			if(mysqli_connect_errno(self::$db_con))
				throw new MY_Exception(NULL, 101);
			return self::$db_con;
		}

		public function executeQuery($query) {
			$result = mysqli_query(self::$db_con, $query, MYSQLI_STORE_RESULT);
			$numRows = gettype($result)=='object'?$result->num_rows:$result['num_rows'];
			if($result === false) {
				throw new My_Exception(NULL, 102);
			}
			else {
				if(gettype($result) == 'boolean') {
					return 1;
				}
				else {
					if($numRows!=0) {
						return 1;
					}
					else
						return 2;
				}
			}
		}

		public function getResults($query) {
			$data = array();
			$result = mysqli_query(self::$db_con, $query, MYSQLI_STORE_RESULT);
			$numRows = gettype($result)=='object'?$result->num_rows:$result['num_rows'];
			if($result === false) {
				throw new My_Exception(NULL, 102);
			}
			else {
				if($numRows>0) {
					while($row = $result->fetch_assoc()) {
						$data[] = $row;
					}
				}
			}
			return $data;
		}

		public function getLastId() {
			return self::$db_con->insert_id;
		}

		public function beginTransaction() {
			$this->executeQuery('START TRANSACTION');
		}

		public function commitTransaction() {
			mysqli_commit(self::$db_con);
		}

		public function rollbackTransaction() {
			mysqli_rollback(self::$db_con);
		}
	}

	class My_Exception extends Exception
	{
		public function errorMessage($errorCode) {
			switch ($errorCode) {
				case '101':
					return "Unable to connect to MySQL Database. Check credentials and try again.";
					break;
				
				case '102':
					return "Query failed. Check query and try again.";
					break;

				case '103':
					return "Query returned no result";
					break;

				case '104':
					return "Invalid command. Refresh and try again.";
					break;
			}
		}
	}
?>