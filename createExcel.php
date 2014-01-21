<?php
	//error_reporting(E_ALL);
	//ini_set('display_errors', 1);
	require_once('/var/www/pricing/PHPExcelReader/Classes/PHPExcel.php');

	class createPricingExcel
	{
		private $excelOb;

		public function __construct() {
			$this->excelOb = new PhpExcel();
		}

		public function createExcelSheet($data) {
			$count = 0;

			foreach($data as $key => $value) {
				if($count>0) {
					$sheetOb = $this->excelOb->createSheet($count);
				}

				$sheetOb = $this->excelOb->setActiveSheetIndex($count);
				$sheetOb->setTitle($key);
				$sheetOb->setCellValue('A1', 'Item Name');
				$sheetOb->setCellValue('B1', 'Unit');
				$sheetOb->setCellValue('C1', 'Price');
				$sheetOb->getStyle('A1:C1')->getFont()->setBold(true)->setSize(12);
				$sheetOb->getStyle('A1:C1')->getBorders()->getBottom()->setBorderStyle(PHPExcel_Style_Border::BORDER_MEDIUM);
				$sheetOb->getStyle('C1:C'.(sizeof($value)+1))->getBorders()->getRight()->setBorderStyle(PHPExcel_Style_Border::BORDER_MEDIUM);
				$sheetOb->getStyle('A' . (sizeof($value)+1) . ':C' . (sizeof($value)+1))->getBorders()->getBottom()->setBorderStyle(PHPExcel_Style_Border::BORDER_MEDIUM);
				$sheetOb->getColumnDimension('A')->setAutoSize(true);
				$sheetOb->getColumnDimension('B')->setAutoSize(true);
				$sheetOb->getColumnDimension('C')->setAutoSize(true);
				$row = 'A';
				$col = 2;
				for($i=0; $i<sizeof($value); $i++) {
					$sheetOb->setCellValue('A'.$col, $value[$i][0]);
					$sheetOb->setCellValue('B'.$col, $value[$i][1]);
					$sheetOb->setCellValue('C'.$col, $value[$i][2]);
					if($col%2==0) {
						$sheetOb->getStyle('A' . $col . ':C' . $col)->applyFromArray(
																	array(
																		'fill' => array(
																						'type' => PHPExcel_Style_Fill::FILL_SOLID, 
																						'color' => array('rgb' => '8DB4E2')
																						)
																		)
																);
					}
					else {
						$sheetOb->getStyle('A' . $col . ':C' . $col)->applyFromArray(
																	array(
																		'fill' => array(
																						'type' => PHPExcel_Style_Fill::FILL_SOLID, 
																						'color' => array('rgb' => 'FCD5B4')
																						)
																		)
																);
					}
					$col++;
				}
				$count++;
			}

			$objWriter = PHPExcel_IOFactory::createWriter($this->excelOb, "Excel2007");
			$name = date("d-m-Y H:i:s").'.xlsx';
			$objWriter->save('excels/pricing/' . $name);

			return array('name'=> $name);
			
			/*header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
			header('Content-Disposition: attachment;filename="' . date("d-m-Y") . '.xlsx"');
			header('Cache-Control: max-age=0');
			$objWriter->save('php://output');*/
		}
	}
?>