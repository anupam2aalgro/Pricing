<?php
	class suppliers 
	{
		private $db_ops;
		protected $transactionStatus = 0;

		public function __construct($db_ob) {
			$this->db_ops = $db_ob;
		}	

		public function getSuppliersByCategory($categoryId) {
			$query = "SELECT * FROM suppliers WHERE supplier_category_id = " . $categoryId . " AND is_hidden = 0";
			$result = $this->db_ops->getResults($query);
			$suppliers = array();

			for($i=0; $i<sizeof($result); $i++) {
				$suppliers[] = array('supplier_id' => $result[$i]['supplier_id'], 'supplier_name' => $result[$i]['supplier_name']);
			}

			return json_encode(array('error' => 0, 'data' => array('suppliers' => $suppliers, 'category_id' => $categoryId)));
		}

		public function deleteSupplier($supplierId) {
			$query = "UPDATE suppliers SET is_hidden = 1 WHERE supplier_id = " . $supplierId;
			$result = $this->db_ops->executeQuery($query);
			return $result;
		}

		public function addSupplier($suppliers, $categoryId) {
			$name = NULL;
			$phone = NULL;
			$address = NULL;
			$newSuppliers = array();
			$comments = array();
			$this->db_ops->beginTransaction();
			$this->transactionStatus = 1;
			for($i=0; $i<sizeof($suppliers); $i++) {
				$name = $suppliers[$i]['name'];
				$phone = $suppliers[$i]['phone'];
				$address = $suppliers[$i]['address'];

				$query = "INSERT INTO suppliers (supplier_category_id, supplier_name, supplier_phone, supplier_address, supplier_added_at, is_hidden) VALUES (" . $categoryId . ", '" . $name . "', '" . $phone . "', '" . $address . "', '" . time() . "', 0)";
				$result = $this->db_ops->executeQuery($query);
				if($result) {
					$lastId = $this->db_ops->getLastId();
					$newSuppliers[$i]['supplier_id'] = $lastId;
					$newSuppliers[$i]['supplier_name'] = $suppliers[$i]['name'];
					$newSuppliers[$i]['phone'] = $suppliers[$i]['phone'];
					$newSuppliers[$i]['address'] = $suppliers[$i]['address'];
				}
				if(array_key_exists('remarks', $suppliers[$i])) {
					$comment = NULL;
					
					for($j=0; $j<sizeof($suppliers[$i]['remarks']); $j++) {
						$comment = $suppliers[$i]['remarks'][$j];
						$commentQuery = "INSERT INTO suppliers_remarks (supplier_id, supplier_remark) VALUES (" . $lastId . ", '" . $comment . "')";
						$result = $this->db_ops->executeQuery($commentQuery);
						if($result) {
							$commentId = $this->db_ops->getLastId();
							$comments[$commentId] = $comment;
						}
					}
					$newSuppliers[$i]['remarks'] = $comments;
					unset($comments);
				}
			}
			$this->db_ops->commitTransaction();
			return json_encode(array('error' => 0, 'data' => array('suppliers' => $newSuppliers)));
		}

		public function getSupplierItems($supplierId) {
			$query = "SELECT * FROM suppliers_items WHERE supplier_id = " . $supplierId . " AND is_hidden = 0";
			$result = $this->db_ops->getResults($query);
			$items = array();
			$units = array();
			$varieties = array();
			if(sizeof($result)>0) {

				for($i=0; $i<sizeof($result); $i++) {
					if(!array_key_exists($result[$i]['item_id'], $items)) {
						$items[$result[$i]['item_id']] = array();;
					}
				}

				for($i=0; $i<sizeof($result); $i++) {
					foreach($items as $key=>$value) {
						if(!array_key_exists($result[$i]['item_variety_id'], $items[$key]) && $key == $result[$i]['item_id']) {
							$items[$key][$result[$i]['item_variety_id']] = array();
						}
					}
				}

				for($i=0; $i<sizeof($result); $i++) {
					foreach ($items as $key => $value) {
						foreach ($value as $vId => $data) {
							if(!array_key_exists($result[$i]['unit_id'], $value[$vId]) && $key == $result[$i]['item_id'] && $vId == $result[$i]['item_variety_id']) {
								$minQ = $result[$i]['item_min_units']==NULL?'':$result[$i]['item_min_units'];
								$maxQ = $result[$i]['item_max_units']==NULL?'':$result[$i]['item_max_units'];
								//$value[$vId][$result[$i]['unit_id']] = array('item_price'=>$result[$i]['item_price'], 'item_min_units'=>$minQ, 'item_max_units'=>$maxQ);
								$value[$vId][$result[$i]['unit_id']] = array('item_price'=>$result[$i]['item_price']);
								$items[$key] = $value;
							}
						}
					}
				}
			}

			return $items;
		}

		public function deleteSupplierItem($supplierId, $itemId, $itemVarietyId, $unitId) {
			$query = "UPDATE suppliers_items SET is_hidden = 1 WHERE supplier_id = " . $supplierId . " AND item_id = " . $itemId . " AND item_variety_id = " . $itemVarietyId . " AND unit_id = " . $unitId;
			$result = $this->db_ops->executeQuery($query);
			if($result == 1)
				$error = 0;
			else
				$error = 1;
			return $error;
		}

		public function addSupplierItems($supplierId, $newItems) {
			$this->db_ops->beginTransaction();
			$this->transactionStatus = 1;
			$query = "INSERT INTO suppliers_items (supplier_id, item_id, item_variety_id, unit_id, item_price, item_min_units, item_max_units, is_hidden)VALUES ";
			$valueString = '';
			$queryPriceHistory = "INSERT INTO suppliers_items_price_history (supplier_id, item_id, item_variety_id, unit_id, item_price, updated_at) VALUES";
			$historyValueString = '';
			
			for($i=0; $i<sizeof($newItems); $i++) {
				$maxQ = "NULL";	//$newItems[$i]['item_max_qty']==NULL?'NULL':$newItems[$i]['item_max_qty'];
				$minQ = "NULL";	//$newItems[$i]['item_min_qty']==NULL?'NULL':$newItems[$i]['item_min_qty'];
				
				$valueString .= "(" . $supplierId . ", " . $newItems[$i]['item_id'] . ", " . $newItems[$i]['item_variety_id'] . ", " . $newItems[$i]['unit_id'] . ", " . $newItems[$i]['item_price'] . ", " . $minQ . ", " . $maxQ . ", 0)";
				$historyValueString .= "(" . $supplierId . ", " . $newItems[$i]['item_id'] . ", " . $newItems[$i]['item_variety_id'] . ", " . $newItems[$i]['unit_id'] . ", " . $newItems[$i]['item_price'] . ", " . time() . ")";
				if(($i+1)<sizeof($newItems)) {
					$valueString .= ", ";
					$historyValueString .= ", ";
				}
			}
			$history = $this->db_ops->executeQuery($queryPriceHistory.$historyValueString); 
			$result = $this->db_ops->executeQuery($query.$valueString);
			$this->db_ops->commitTransaction();
			if($result) {
				return json_encode(array('error'=>0, 'data'=>$newItems));
			}
		}

		public function editSupplierItem($supplierId, $itemData) {
			$counter = 0;
			$successData = array();
			$this->db_ops->beginTransaction();
			$this->transactionStatus = 1;
			$queryPriceHistory = "INSERT INTO suppliers_items_price_history (supplier_id, item_id, item_variety_id, unit_id, item_price, updated_at) VALUES";
			$historyValueString = '';

			for($i=0; $i<sizeof($itemData); $i++) {
				$query = "UPDATE suppliers_items SET item_price = " . $itemData[$i]['item_price'];
				
				/*foreach ($itemData[$i] as $key => $value) {
					$query .= $key . " = " . $value;
					$counter++;
					if($counter < sizeof($itemData)) {
						$query .= ", ";
					}
				}*/

				$historyValueString .= "(" . $supplierId . ", " . $itemData[$i]['item_id'] . ", " . $itemData[$i]['item_variety_id'] . ", " . $itemData[$i]['unit_id'] . ", " . $itemData[$i]['item_price'] . ", '" . time() . "')";
				$result = $this->db_ops->executeQuery($queryPriceHistory . $historyValueString);
				$historyValueString = '';
				$query .= " WHERE supplier_id = " . $supplierId . " AND item_id = " . $itemData[$i]['item_id'] . " AND item_variety_id = " . $itemData[$i]['item_variety_id'] . " AND unit_id = " . $itemData[$i]['unit_id'];
				$result = $this->db_ops->executeQuery($query);
				if($result == 1) {
					$successData[] = $itemData[$i];
				}
			}
			$this->db_ops->commitTransaction();
			if(sizeof($successData)>0) {
				return json_encode(array('error'=>0, 'data'=>$successData));
			}
			else {
				return json_encode(array('error'=>1));
			}
		}

		public function getSupplierInfo($supplierId) {
			$supplierInfo = array();
			$remarksInfo = array();
			$query = "SELECT * FROM suppliers WHERE supplier_id = " . $supplierId . " AND is_hidden = 0";
			$result = $this->db_ops->getResults($query);
			$remarksQuery = "SELECT * FROM suppliers_remarks WHERE supplier_id = " . $supplierId;
			$remarks = $this->db_ops->getResults($remarksQuery);
			if(sizeof($result)>0) {
				$supplierInfo['supplier_id'] = $result[0]['supplier_id'];
				$supplierInfo['supplier_name'] = $result[0]['supplier_name'];
				$supplierInfo['supplier_phone'] = $result[0]['supplier_phone'];
				$supplierInfo['supplier_address'] = $result[0]['supplier_address'];
				$supplierInfo['supplier_added_at'] = $result[0]['supplier_added_at'];
				if(sizeof($remarks)>0) {
					for($i=0; $i<sizeof($remarks); $i++) {
						$remarksInfo[$remarks[$i]['supplier_remark_id']] = $remarks[$i]['supplier_remark'];
					}
					$supplierInfo['supplier_remarks'] = $remarksInfo;
				}
			}
			return json_encode(array('error'=>0, 'data'=>$supplierInfo));
		}

		public function editSupplierInfo($supplierInfo) {
			$this->db_ops->beginTransaction();
			$this->transactionStatus = 1;
			$params = array();

			if(array_key_exists('address', $supplierInfo)) {
				$params[] = 'supplier_address = "' . $supplierInfo['address'] . '"';
			}

			if(array_key_exists('name', $supplierInfo)) {
				$params[] = 'supplier_name = "' . $supplierInfo['name'] . '"';
			}

			if(array_key_exists('phone', $supplierInfo)) {
				$params[] = 'supplier_phone = ' . $supplierInfo['phone'];
			}

			$param = implode(',', $params);

			$query = "UPDATE suppliers SET " . $param . " WHERE supplier_id = " . $supplierInfo['supplier_id'];
			$result = $this->db_ops->executeQuery($query);
			$this->db_ops->commitTransaction();
			return $result;
		}

		public function getTransactionStatus() {
			return $this->transactionStatus;
		}

		public function rollbackTransactions() {
			$this->db_ops->rollbackTransaction();
		}
	}
?>