<?php
header('Content-type: application/json');
require_once('settings.php');
require_once('db.php');
require_once('items.php');
require_once('suppliers.php');
require_once('pricing.php');
require_once('logon.php');
require_once('createExcel.php');
require_once('sessionValidator.php');

@session_start();
try {
		$db_ob = new db_ops(HOST, USERNAME, PASSWORD, DB);
		$items_ob = new items($db_ob);
		$suppliers_ob = new suppliers($db_ob);
		$pricing_ob = new pricing($db_ob);
		$login_ob = new login($db_ob);
		$excelOb = new createPricingExcel();

		if(isset($_REQUEST['command'])) {
			if($_REQUEST['command'] == 'Login') {
				$username = $_REQUEST['username'];
				$password = $_REQUEST['password'];

				$result = $login_ob->userLogin(htmlspecialchars($username, ENT_QUOTES), $password);
				if(strlen($result['session']) == 0)
					$error = 1;
				else
					$error = 0;

				echo json_encode(array('error'=>$error, 'data'=>$result));
				die();
			}
		}
		if(isset($_COOKIE['username'])) {
			$username = $_COOKIE['username'];
			if(isset($_COOKIE['session'])) {
				$session = $_COOKIE['session'];
				$ob = new validateSession();
				$validSession = $ob->validateCurrentSession($username, $session);
				if($validSession) {
					$command = $_REQUEST['command'];					

					switch($command) {
						/* Items */
						case 'GetItemsByCategory':
							$category_id = $_REQUEST['category_id'];
							$result = $items_ob->getItemsByCategory($category_id);
							echo $result;
							break;

						case 'EditItem':
							$itemId = $_REQUEST['item_id'];
							$data = $_REQUEST['data'];
							$result = $items_ob->editItems($itemId, $data);
							echo $result;
							break;

						case 'AddItems':
							$newItems = $_REQUEST['new_items'];
							$result = $items_ob->addItems($newItems);			
							echo $result;

							break;

						case 'DeleteItem':
							$itemId = $_REQUEST['item_id'];
							$result = $items_ob->deleteItem($itemId);
							echo $result;
						
						/* Suppliers */
						case 'GetSuppliersByCategory':
							$categoryId = $_REQUEST['category_id'];
							echo $suppliers_ob->getSuppliersByCategory($categoryId);			
							break;

						case 'DeleteSupplier':
							$supplierId = $_REQUEST['supplier_id'];
							$result = $suppliers_ob->deleteSupplier($supplierId);
							if($result == 1)
								echo json_encode(array('error' => 0));
							else
								echo json_encode(array('error' => 1));
							
							break;

						case 'GetSupplierInfo':
							$supplierId = $_REQUEST['supplier_id'];
							echo $suppliers_ob->getSupplierInfo($supplierId);
							break;

						case 'EditSupplierInfo':
							$supplierInfo = $_REQUEST['supplier_info'];
							$result = $suppliers_ob->editSupplierInfo($supplierInfo);
							
							if($result == 1) {
								echo json_encode(array('error'=>0, 'data'=>$supplierInfo));
							}
							else {
								echo json_encode(array('error'=>1));
							}
							break;

						case 'AddSuppliers':
							$supplierCategoryId = $_REQUEST['supplier_category_id'];
							$supplierData = $_REQUEST['new_suppliers'];
							echo $suppliers_ob->addSupplier($supplierData, $supplierCategoryId);
							break;

						case 'GetSupplierItems':
							$response = array();
							$supplierId = $_REQUEST['supplier_id'];
							$itemOption = $_REQUEST['update_items'];

							if($itemOption == 1) {
								$response['items'] = $items_ob->getAllItems();
							}

							$response['supplier_items'] = $suppliers_ob->getSupplierItems($supplierId);
							echo json_encode(array('error' => 0, 'data' => $response));
							break;

						case 'DeleteSupplierItem':
							$supplierId = $_REQUEST['supplier_id'];
							$itemId = $_REQUEST['item_id'];
							$itemVarietyId = $_REQUEST['item_variety_id'];
							$unitId = $_REQUEST['unit_id'];

							$result = $suppliers_ob->deleteSupplierItem($supplierId, $itemId, $itemVarietyId, $unitId);
							echo json_encode(array('error' => $result));

							break;

						case 'AddSupplierItems':			
							$supplierId = $_REQUEST['supplier_id'];
							$newItems = $_REQUEST['new_items'];
							echo $suppliers_ob->addSupplierItems($supplierId, $newItems);
							break;

						case 'EditSupplierItems':
							$itemData = $_REQUEST['items'];
							$supplierId = $_REQUEST['supplier_id'];
							$unitId = $_REQUEST['unit_id'];

							$result = $suppliers_ob->editSupplierItem($supplierId, $itemData);
							echo $result;

							break;

						case 'GetItemsforPricing':
							$data = $pricing_ob->getItemsForPricing();
							echo json_encode(array('error' => 0, 'data' => $data));

							break;

						case 'GetSuppliersforPricing':
							$selectedItems = $_POST['selected_items'];
							$data = $pricing_ob->getSuppliersForPricing($selectedItems);		
							echo json_encode(array('error' => 0, 'data' => $data));
							
							break;

						case 'SaveAalgroPrices':
							$editedPrices = $_REQUEST['edited_prices'];
							$result = $pricing_ob->saveAalgroPrices($editedPrices);
							if(sizeof($result)>0) {
								$response = array('error'=>0, 'data'=>$result);
							}
							else {
								$response = array('error'=>1);
							}
							echo json_encode($response);
							break;

						case 'Logout':
							$username = htmlspecialchars($_COOKIE['username'], ENT_QUOTES);
							$sessionVar = $_COOKIE['session'];
							$result = $login_ob->destroySession($username, $sessionVar);
							if($result)
								$error = 0;
							else
								$error = 1;

							echo json_encode(array('error'=>$error));
							break;

						case 'CreatePricingExcel': 
							$data = $_POST['data'];
							$result = $excelOb->createExcelSheet($data);
							echo json_encode(array('error'=>0, 'data'=>$result));
							break;
					}
					
				}
				else {
					echo json_encode(array('error'=>'Failed to validate user'));
				}
			}
		}
		else {
			echo json_encode(array('error'=>'Failed to validate user'));
		}
	}
	catch(My_Exception $e) {
		if($items_ob->getTransactionStatus()) {
			$items_ob->rollbackTransaction();
		}

		if($suppliers_ob->getTransactionStatus()) {
			$suppliers_ob->rollbackTransaction();
		}
		
		if($pricing_ob->getTransactionStatus()) {
			$pricing_ob->rollbackTransaction();
		}
		echo json_encode(array('error' => 1, 'code' => $e->getCode(), 'message' => $e->ErrorMessage($e->getCode())));
		exit();
	}

?>