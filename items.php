<?php
	require_once('db.php');
	
	class items
	{
		private $db_ops;
		protected $transactionStatus = 0;

		public function __construct($db_ops) {
			$this->db_ops = $db_ops;//new db_ops('localhost', 'abhas_aalgro', 'b2baalgro_mysql', 'abhas_aalgro_store');
		}

		public function getItemsByCategory($categoryId) {
			$items = array();
			$units = array();
			
			/*$query = "SELECT item_category_id FROM item_categories WHERE item_category_name = '" . $categoryName . "';";
			$result = $this->db_ops->getResults($query);
			$categoryId = $result[0]['item_category_id'];*/
			
			$query = "SELECT * FROM units";
			$result = $this->db_ops->getResults($query);
			for($i=0; $i<sizeof($result); $i++) {
				$units[$result[$i]['unit_id']] = $result[$i]['unit_name'];
			}
			
			$query = "SELECT * FROM items_units WHERE is_hidden = 0";
			$item_units = $this->db_ops->getResults($query);
						
			$query = "SELECT * FROM items WHERE item_category_id=" . $categoryId . " AND is_hidden=0 ORDER BY item_name";
			$result = $this->db_ops->getResults($query);
			
			for($i=0; $i<sizeof($result); $i++) {
				$items['_' . $result[$i]['item_id']] = array('item_name'=>$result[$i]['item_name']);
				$temp_array = array();
				for($j=0; $j<sizeof($item_units); $j++) {
					if($item_units[$j]['item_id'] == $result[$i]['item_id']) {
						$temp_array[$item_units[$j]['unit_id']] = $units[$item_units[$j]['unit_id']];
					}
				}
				$items['_' . $result[$i]['item_id']]['item_units'] = $temp_array;
				unset($temp_array);
				$temp_array = array();
				$query = "SELECT * FROM items_varieties WHERE item_id = " . $result[$i]['item_id'] . " AND is_hidden=0";
				$varieties = $this->db_ops->getResults($query);
				for($j=0; $j<sizeof($varieties); $j++) {
					if(strlen($varieties[$j]['item_variety_name'])>0)
						$temp_array[$varieties[$j]['item_variety_id']] = $varieties[$j]['item_variety_name'];
				}
				
				//if(@gettype($temp_array)!='NULL')
					$items['_' . $result[$i]['item_id']]['item_varieties'] = $temp_array;
				unset($temp_array);
			}
			return json_encode(array('error'=>0, 'data'=>array('units'=>$units, 'items'=>$items, 'category_id'=>$categoryId)));

		}

		public function editItems($item_id, $data) {
			$response = 0;
			$this->db_ops->beginTransaction();
			$this->transactionStatus = 1;

			if($data != NULL) {
				if(array_key_exists("item_name", $data)) {
					$query = "UPDATE items SET item_name = '" . $data['item_name'] . "' WHERE item_id = " . $item_id;
					$result = $this->db_ops->executeQuery($query);
				}
				
				if(array_key_exists("item_units_added", $data)) {
					$valueString = '';
					for($i=0; $i<sizeof($data['item_units_added']); $i++) {
						$valueString .= "(" . $data['item_units_added'][$i] . ", " . $item_id . ", 0)";
						$valueString .= ($i+1)<sizeof($data['item_units_added'])? ", ":"";
					}
					$query = "INSERT INTO items_units (unit_id, item_id, is_hidden) VALUES " . $valueString;
					$result = $this->db_ops->executeQuery($query);
					
				}

				if(array_key_exists("item_units_removed", $data)) {
					for($i=0; $i<sizeof($data['item_units_removed']); $i++) {
						$query = "UPDATE items_units SET is_hidden = 1 WHERE item_id=" . $item_id . " AND unit_id=" . $data['item_units_removed'][$i];
						$result = $this->db_ops->executeQuery($query);
						
					}
				}

				if(array_key_exists("item_varieties_added", $data)) {
					$valueString = '';		
					for($i=0; $i<sizeof($data['item_varieties_added']); $i++) {
						$valueString .= "(" . $item_id . ", '" . $data['item_varieties_added'][$i] . "', 0)";
						$valueString .= ($i+1)<sizeof($data['item_varieties_added'])? ", ":"";
					}

					$query = "INSERT INTO items_varieties (item_id, item_variety_name, is_hidden) VALUES " . $valueString;
					$result = $this->db_ops->executeQuery($query);
				}

				if(array_key_exists("item_varieties_edited", $data)) {
					for($i=0; $i<sizeof($data['item_varieties_edited']); $i++) {
						$query = "UPDATE items_varieties SET item_variety_name = '" . $data['item_varieties_edited'][$i]['item_variety_name'] . "' WHERE item_variety_id = " . $data['item_varieties_edited'][$i]['item_variety_id'];
						$result = $this->db_ops->executeQuery($query);
					}
				}

				if(array_key_exists("item_varieties_removed", $data)) {
					for($i=0; $i<sizeof($data['item_varieties_removed']); $i++) {
						$query = "UPDATE items_varieties SET is_hidden = 1 WHERE item_variety_id = " . $data['item_varieties_removed'][$i];
						$result = $this->db_ops->executeQuery($query);
					}
				}
			}
			$this->db_ops->commitTransaction();
			$item = $this->getItemById($item_id);

			return json_encode(array('error' => 0, 'data' => array('item' => $item)));
		}

		public function addItems($newItems) {
			$addedItems = array();
			$itemCategory;
			$itemName;
			$this->db_ops->beginTransaction();
			$this->transactionStatus = 1;
			$query = "SELECT * FROM units WHERE is_hidden = 0";
			$units = $this->db_ops->getResults($query);
			$tempUnits = array();
			$response = '';
			for($i=0; $i<sizeof($newItems); $i++) {
				$itemCategory = $newItems[$i]['category_id'];
				$itemName = $newItems[$i]['item_name'];
				$query = "INSERT INTO items (item_category_id, item_name, is_hidden) VALUES (" . $itemCategory . ", '" . $itemName . "', 0)";
				$result = $this->db_ops->executeQuery($query);
				if($result == 1) {
					$lastId = $this->db_ops->getLastId();
					$addedItems[$i]['item_id'] = $lastId;
					$addedItems[$i]['item_name'] = $itemName;
					for($j=0; $j<sizeof($newItems[$i]['item_units']); $j++) {
						$unitId = $newItems[$i]['item_units'][$j];
						$itemUnitQuery = "INSERT INTO items_units VALUES (" . $unitId . ", " . $lastId . ", 0)";
						$unitResult = $this->db_ops->executeQuery($itemUnitQuery);
						if($unitResult == 1) {
							for($k=0; $k<sizeof($units); $k++) {
								if($unitId == $units[$k]['unit_id']) {
									$tempUnits[$unitId] = $units[$k]['unit_name'];
								}
							}
						}
					}
					$addedItems[$i]['item_units'] = $tempUnits;
					unset($tempUnits);
					$itemVarietyQuery = "INSERT INTO items_varieties (item_id, item_variety_name, is_hidden) VALUES (" . $lastId . ", '', 0)";
					$result = $this->db_ops->executeQuery($itemVarietyQuery);
					if(array_key_exists('item_varieties', $newItems[$i])) {
						for($j=0; $j<sizeof($newItems[$i]['item_varieties']); $j++) {
							$itemVarietyQuery = "INSERT INTO items_varieties (item_id, item_variety_name, is_hidden) VALUES (" . $lastId . ", '" . $newItems[$i]['item_varieties'][$j] . "', 0)";
							$result = $this->db_ops->executeQuery($itemVarietyQuery);
							if($result == 1) {
								$tempUnits[$this->db_ops->getLastId()] = $newItems[$i]['item_varieties'][$j];
							}
						}
						$addedItems[$i]['item_varieties'] = $tempUnits;
						unset($tempUnits);
					}
				}
			}
			$this->db_ops->commitTransaction();
			//return $query;
			return json_encode(array('error'=>0, 'data'=>array('items'=>$addedItems)));
		}

		public function getItemById($itemId) {
			$items = array();
			$units = array();
			$temp_array = array();

			$query = "SELECT * FROM units";
			$result = $this->db_ops->getResults($query);
			for($i=0; $i<sizeof($result); $i++) {
				$units[$result[$i]['unit_id']] = $result[$i]['unit_name'];
			}

			$query = "SELECT * FROM items WHERE item_id=" . $itemId . " AND is_hidden=0";
			$result = $this->db_ops->getResults($query);
			$item['item_id'] = $itemId;
			$item['item_name'] = $result[0]['item_name'];

			$query = "SELECT * FROM items_units WHERE item_id = " . $itemId . " AND is_hidden=0";
			$item_units = $this->db_ops->getResults($query);
			for($j=0; $j<sizeof($item_units); $j++) {
				$temp_array[$item_units[$j]['unit_id']] = $units[$item_units[$j]['unit_id']];
			}
			$item['item_units'] = $temp_array;
			unset($temp_array);

			$query = "SELECT * FROM items_varieties WHERE item_id = " . $itemId . " AND is_hidden=0";
			$varieties = $this->db_ops->getResults($query);
			for($j=0; $j<sizeof($varieties); $j++) {
				if(strlen($varieties[$j]['item_variety_name'])>0)
					$temp_array[$varieties[$j]['item_variety_id']] = $varieties[$j]['item_variety_name'];
			}
			
			if(@gettype($temp_array)!='NULL')
				$item['item_varieties'] = $temp_array;
			unset($temp_array);
			return $item;
		}

		public function deleteItem($itemId) {
			$query = "UPDATE items SET is_hidden = 1 WHERE item_id = " . $itemId;
			$result = $this->db_ops->executeQuery($query);

			$query = "UPDATE items_units SET is_hidden = 1 WHERE item_id = " . $itemId;
			$result = $this->db_ops->executeQuery($query);

			$query = "UPDATE items_varieties SET is_hidden = 1 WHERE item_id = " . $itemId;
			$result = $this->db_ops->executeQuery($query);

			/*$query = "UPDATE items_varieties_price_history SET is_hidden = 1 WHERE item_id = " . $itemId;
			$result = $this->db_ops->executeQuery($query);*/

			$query = "UPDATE suppliers_items SET is_hidden = 1 WHERE item_id = " . $itemId;
			$result = $this->db_ops->executeQuery($query);

			return json_encode(array('error'=>0));
		}

		public function getAllItems() {
			$items = array();
			$units = array();
			$varieties = array();

			$query = "SELECT * FROM units WHERE is_hidden = 0";
			$predefinedUnits = $this->db_ops->getResults($query);

			$query = "SELECT * FROM items WHERE is_hidden = 0";
			$result = $this->db_ops->getResults($query);

			if(sizeof($result)>0) {
				for($i=0; $i<sizeof($result); $i++) {
					$items[$result[$i]['item_id']]['item_name'] = $result[$i]['item_name'];
					$query = "SELECT * FROM items_units WHERE item_id = " . $result[$i]['item_id'] . " AND is_hidden = 0";
					$unitsResult = $this->db_ops->getResults($query);
					if(sizeof($unitsResult)>0) {
						for($j=0; $j<sizeof($unitsResult); $j++) {
							for($k=0; $k<sizeof($predefinedUnits); $k++) {
								if($unitsResult[$j]['unit_id'] == $predefinedUnits[$k]['unit_id']) {
									$units[$unitsResult[$j]['unit_id']] = $predefinedUnits[$k]['unit_name'];
								}
							}
						}
						$items[$result[$i]['item_id']]['item_units'] = $units;
						unset($units);
					}

					$query = "SELECT * FROM items_varieties WHERE item_id = " . $result[$i]['item_id'] . " AND is_hidden = 0";
					$varietiesResult = $this->db_ops->getResults($query);
					if(sizeof($varietiesResult)>0) {
						for($j=0; $j<sizeof($varietiesResult); $j++) {
							$varieties[$varietiesResult[$j]['item_variety_id']] = $varietiesResult[$j]['item_variety_name'];
						}
						$items[$result[$i]['item_id']]['item_varieties'] = $varieties;
						unset($varieties);
					}
				}
			}
			return $items;
		}

		public function getTransactionStatus() {
			return $this->transactionStatus;
		}

		public function rollbackTransactions() {
			$this->db_ops->rollbackTransaction();
		}
	}
?>