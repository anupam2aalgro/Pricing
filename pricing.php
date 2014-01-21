<?php
	class pricing
	{
		private $db_ops;
		protected $transactionStatus = 0;

		public function __construct($db_ops) {
			$this->db_ops = $db_ops;
		}

		public function getItemsForPricing() {
			$units = array();
			$leafy = array();
			$fruits = array();
			$exotic = array();
			$opg = array();
			$vegetables = array();

			$query = "SELECT * FROM units";
			$result = $this->db_ops->getResults($query);
			for($i=0; $i<sizeof($result); $i++) {
				$units[$result[$i]['unit_id']] = $result[$i]['unit_name'];
			}

			$query = "SELECT * FROM items WHERE is_hidden = 0 ORDER BY item_name";
			$allItems = $this->db_ops->getResults($query);

			$query = "SELECT * FROM items_varieties WHERE is_hidden = 0";
			$allVarieties = $this->db_ops->getResults($query);

			$query = "SELECT * FROM items_units WHERE is_hidden = 0";
			$allUnits = $this->db_ops->getResults($query);

			$tempVarieties = array();
			for($i=0; $i<sizeof($allVarieties); $i++) {
				$tempVarieties[$allVarieties[$i]['item_id']][] = array($allVarieties[$i]['item_variety_id']=>$allVarieties[$i]['item_variety_name']);
			}

			foreach ($tempVarieties as $key => $value) {
				foreach ($value as $index => $array) {
					foreach ($array as $id => $name) {
						$newValue[$id] = $name;
					}
				}
				$tempVarieties[$key] = $newValue;
				unset($newValue);	
			}

			$tempUnits = array();
			for($i=0; $i<sizeof($allUnits); $i++) {
				$tempUnits[$allUnits[$i]['item_id']][] = array($allUnits[$i]['unit_id']=>$units[$allUnits[$i]['unit_id']]);
			}

			foreach ($tempUnits as $key => $value) {
				foreach ($value as $index => $array) {
					foreach ($array as $id => $name) {
						$newValue[$id] = $name;
					}
				}
				$tempUnits[$key] = $newValue;
				unset($newValue);	
			}

			for($i=0; $i<sizeof($allItems); $i++) {
				if($allItems[$i]['item_category_id'] == 101) {
					$leafy[$allItems[$i]['item_id']] = array('item_name'=>$allItems[$i]['item_name'], 'item_units'=>$tempUnits[$allItems[$i]['item_id']], 'item_varieties'=>$tempVarieties[$allItems[$i]['item_id']]);
				}
				if($allItems[$i]['item_category_id'] == 102) {
					$fruits[$allItems[$i]['item_id']] = array('item_name'=>$allItems[$i]['item_name'], 'item_units'=>$tempUnits[$allItems[$i]['item_id']], 'item_varieties'=>$tempVarieties[$allItems[$i]['item_id']]);
				}
				if($allItems[$i]['item_category_id'] == 103) {
					$exotic[$allItems[$i]['item_id']] = array('item_name'=>$allItems[$i]['item_name'], 'item_units'=>$tempUnits[$allItems[$i]['item_id']], 'item_varieties'=>$tempVarieties[$allItems[$i]['item_id']]);
				}
				if($allItems[$i]['item_category_id'] == 104) {
					$opg[$allItems[$i]['item_id']] = array('item_name'=>$allItems[$i]['item_name'], 'item_units'=>$tempUnits[$allItems[$i]['item_id']], 'item_varieties'=>$tempVarieties[$allItems[$i]['item_id']]);
				}
				if($allItems[$i]['item_category_id'] == 105) {
					$vegetables[$allItems[$i]['item_id']] = array('item_name'=>$allItems[$i]['item_name'], 'item_units'=>$tempUnits[$allItems[$i]['item_id']], 'item_varieties'=>$tempVarieties[$allItems[$i]['item_id']]);
				}
			}

			return array('101' => $leafy, '102' => $fruits, '103' => $exotic, '104' => $opg, '105' => $vegetables);
		}

		public function getSuppliersForPricing($selectedItems) {
			$tempArray = array();
			$supplierPricing = array();
			$supplierData = array();
			$supplierCategories = array();

			$query = "SELECT * FROM supplier_categories WHERE is_hidden = 0";
			$result = $this->db_ops->getResults($query);
			for($i=0; $i<sizeof($result); $i++) {
				$supplierCategories[$result[$i]['supplier_category_id']] = $result[$i]['supplier_category_name'];
			}

			$query = "SELECT * FROM suppliers WHERE is_hidden = 0 ORDER BY supplier_category_id";
			$allSuppliers = $this->db_ops->getResults($query);

			$query = "SELECT * FROM suppliers_items WHERE is_hidden = 0";
			$allSupplierItems = $this->db_ops->getResults($query);

			for($i=0; $i<sizeof($allSupplierItems); $i++) {
				$tempArray[$allSupplierItems[$i]['supplier_id']][$allSupplierItems[$i]['item_id']][$allSupplierItems[$i]['item_variety_id']][$allSupplierItems[$i]['unit_id']] = array('item_price'=>$allSupplierItems[$i]['item_price']);
			}

			for($i=0; $i<sizeof($allSuppliers); $i++) {
				$supplierData[$allSuppliers[$i]['supplier_id']]['supplier_name'] = $allSuppliers[$i]['supplier_name'];
				$supplierData[$allSuppliers[$i]['supplier_id']]['supplier_category_id'] = $allSuppliers[$i]['supplier_category_id'];
				$supplierData[$allSuppliers[$i]['supplier_id']]['supplier_category'] = $supplierCategories[$allSuppliers[$i]['supplier_category_id']];
				if(array_key_exists($allSuppliers[$i]['supplier_id'], $tempArray))
					$supplierData[$allSuppliers[$i]['supplier_id']]['supplier_items'] = $tempArray[$allSuppliers[$i]['supplier_id']];
				else
					$supplierData[$allSuppliers[$i]['supplier_id']]['supplier_items'] = '';
			}

			$supplierUnset = array();
			$itemsUnset = 1;
			foreach ($supplierData as $key => $value) {
				if(gettype($value['supplier_items']) == 'array') {
					foreach($value['supplier_items'] as $index => $data) {
						for($i=0; $i<sizeof($selectedItems); $i++) {
							if($index == $selectedItems[$i]) {
								$itemsUnset = 0;
								break;
							}
						}
						if($itemsUnset == 1) {
							unset($supplierData[$key]['supplier_items'][$index]);
						}
						else {
							$itemsUnset = 1;
						}
					}
					if(sizeof($supplierData[$key]['supplier_items'])==0) {
						unset($supplierData[$key]);
					}
				}
				else {
					unset($supplierData[$key]);
				}
			}

			$prices = array();
			for($i=0; $i<sizeof($selectedItems); $i++) {
				$query = "SELECT * FROM items_varieties_price WHERE item_id = " . $selectedItems[$i];
				$result = $this->db_ops->getResults($query);
				for($j=0; $j<sizeof($result); $j++) {
					$prices[$result[$j]['item_id']][$result[$j]['item_variety_id']][$result[$j]['unit_id']] = array('price_1'=>$result[$j]['aalgro_price_1'], 'price_2'=>$result[$j]['aalgro_price_2'], 'price_3'=>$result[$j]['aalgro_price_3']);
				}
			}

			return array('suppliers' => $supplierData, 'prices' => $prices);

		}

		public function saveAalgroPrices($editedPrices) {
			$args = array();
			$args[] = 'updated_at = "' . time() . '"';
			$values = array();
			
			$cols = array();
			$responseArray = array();
			$tempArray = array();

			$this->db_ops->beginTransaction();
			$this->transactionStatus = 1;

			for($i=0; $i<sizeof($editedPrices); $i++) {
				$cols[] = 'item_variety_id';
				$cols[] = 'item_id';
				$cols[] = 'unit_id';
				$cols[] = 'updated_at';

				$values[] = $editedPrices[$i]['item_variety_id'];
				$values[] = $editedPrices[$i]['item_id'];
				$values[] = $editedPrices[$i]['unit_id'];
				$values[] = '"' . time() . '"';

				if(array_key_exists('price_1', $editedPrices[$i])) {
					$args[] = 'aalgro_price_1 = ' . $editedPrices[$i]['price_1'];
					$cols[] = 'aalgro_price_1';
					$values[] = $editedPrices[$i]['price_1'];
					$tempArray[$editedPrices[$i]['item_id']][$editedPrices[$i]['item_variety_id']][$editedPrices[$i]['unit_id']]['price_1'] = $editedPrices[$i]['price_1'];
				}
				if(array_key_exists('price_2', $editedPrices[$i])) {
					$args[] = 'aalgro_price_2 = ' . $editedPrices[$i]['price_2'];
					$cols[] = 'aalgro_price_2';
					$values[] = $editedPrices[$i]['price_2'];
					$tempArray[$editedPrices[$i]['item_id']][$editedPrices[$i]['item_variety_id']][$editedPrices[$i]['unit_id']]['price_2'] = $editedPrices[$i]['price_2'];
				}
				if(array_key_exists('price_3', $editedPrices[$i])) {
					$args[] = 'aalgro_price_3 = ' . $editedPrices[$i]['price_3'];
					$cols[] = 'aalgro_price_3';
					$values[] = $editedPrices[$i]['price_3'];
					$tempArray[$editedPrices[$i]['item_id']][$editedPrices[$i]['item_variety_id']][$editedPrices[$i]['unit_id']]['price_3'] = $editedPrices[$i]['price_3'];
				}

				$columns = implode(',', $cols);
				$prices = implode(',', $args);
				$value = implode(',', $values);
				
				$query = "INSERT INTO items_varieties_price (" . $columns . ") VALUES (" . $value . ") ON DUPLICATE KEY UPDATE " . $prices;
				$result = $this->db_ops->executeQuery($query);
				if(!$result) {
					unset($tempArray[$editedPrices[$i]['item_id']][$editedPrices[$i]['item_variety_id']][$editedPrices[$i]['unit_id']]);
				}

				$query = "INSERT INTO items_varieties_price_history (" . $columns . ") VALUES (" . $value . ")";
				$result = $this->db_ops->executeQuery($query);
				unset($args);
				unset($values);
				unset($cols);
				unset($values);
			}
			$this->db_ops->commitTransaction();
			$responseArray = $tempArray;
			unset($tempArray);

			return $responseArray;
		}

		public function getTransactionStatus() {
			return $this->transactionStatus;
		}

		public function rollbackTransactions() {
			$this->db_ops->rollbackTransaction();
		}
	}	
?>