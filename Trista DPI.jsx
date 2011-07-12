﻿//
// Обработка картинок
//
// v1.0
//
// Денис Либит
// Студия КолорБокс
// denis@boxcolor.ru
// www.boxcolor.ru
// -----------------------------------------------------------------------------------

#target indesign

var myStatusWindow;
var myStatusWindowPhase;
var myStatusWindowObject;
var myStatusWindowSubObject;
var myStatusWindowGauge;
var myStatusWindowSubGauge;

var myPreferences = new Array();
var myPreferencesFileName;

var mySmallFont;
var myHeaderColor = [0.1, 0.1, 0.1];

var myDocuments;
var myPages;
var myGraphicsList = [];

var myFlagStopExecution = false;


main();

// "Стартую!" (эпитафия на могиле Неизвестной Секретарши)
// ------------------------------------------------------
function main(){
	if (!initialSettings()) return;
	if (!makeStatusWindow()) return;
	if (!checkDocumentStatus()) return;
	if (!displayPreferences()) return;
	if (!selectImages()) return;
	if (!backupImages()) return;
	if (!processImages()) return;
}

// Стартовые настройки
// ------------------------------------------------------
function initialSettings() {
	app.scriptPreferences.userInteractionLevel = UserInteractionLevels.interactWithAll;
	app.scriptPreferences.enableRedraw = true;
	
	// Настройки по умолчанию
	myPreferences["changeFormat"] = true;
	myPreferences["clippedImagesToPSD"] = true;
	myPreferences["removeClipping"] = true;
	myPreferences["deleteOriginals"] = true;
	
	myPreferences["changeSize"] = true;
	
	myPreferences["targetDPI"] = 300;
	
	myPreferences["scope"] = 1;
	
	myPreferences["downsample"] = true;
	myPreferences["downsampleThreshold"] = 300;
	myPreferences["upsample"] = false;
	myPreferences["upsampleThreshold"] = 300;
	
	myPreferences["backup"] = true;
	
	if ($.os.toLowerCase().indexOf("macintosh") != -1) {
		myPreferencesFileName = "~/Library/Preferences/ru.colorbox.tristatnd.txt";
		myPreferences["backupFolder"] = "~/Documents/300dpi backup/";
	} else if ($.os.toLowerCase().indexOf("windows") != -1) {
		myPreferencesFileName = "~/Library/Preferences/ru.colorbox.tristatnd.txt";
		myPreferences["backupFolder"] = "~/Documents/300dpi backup/";
	}

	// Загрузить настройки
	var myPreferencesFile = new File(myPreferencesFileName);
	if (myPreferencesFile.exists) {
		var myPreferencesFile = new File(myPreferencesFileName);
		if (myPreferencesFile.open("r")) {
			var myPreferencesArray = myPreferencesFile.read(myPreferencesFile.length).split("\n");
			var myPreferenceRecord = [];
			
			for (i = 0; i < myPreferencesArray.length; i++) {
				myPreferenceRecord = myPreferencesArray[i].split("\t");
				if (myPreferenceRecord[1] == "boolean") {
					myPreferences[myPreferenceRecord[0]] = (myPreferenceRecord[2] == "true");
				} else if (myPreferenceRecord[1] == "number") {
					myPreferences[myPreferenceRecord[0]] = Number(myPreferenceRecord[2]);
				} else {
					myPreferences[myPreferenceRecord[0]] = myPreferenceRecord[2];
				}
			}
			
			if (!myPreferencesFile.close()) {
				alert("Ошибка при чтении настроек.\nТо-есть файл-то с настройками есть, да вот открыть его не получается.\n\nВыполнение скрипта прекращаем.");
				return false;
			}
		}
	}
	
	return true;
}

// Соберём окно с градусником
// ------------------------------------------------------
function makeStatusWindow() {
	var myPanelWidth = 300;
	
	// Собираем палитру
	myStatusWindow = new Window("palette", "Выполнение");
	myStatusWindow.orientation = "row";
	myStatusWindow.alignChildren = ["fill", "top"];
	
	// Константы
	mySmallFont = myStatusWindow.graphics.font = ScriptUI.newFont("dialog", "Regular", 10);
	
	// Область отображения статусных данных
	var myDisplayZone = myStatusWindow.add("group");
	myDisplayZone.orientation = "column";
	myDisplayZone.minimumSize.width = myPanelWidth;
	myDisplayZone.maximumSize.width = myPanelWidth;
	myDisplayZone.alignChildren = ["fill", "top"];
	
	// Элементы статусных данных
	
	// Фаза
	myStatusWindowPhase = myDisplayZone.add("statictext", undefined, "");
	myStatusWindowPhase.minimumSize.height = 30;
	myStatusWindowPhase.alignment = ["fill", "top"];
	myStatusWindowPhase.justify = "left";
	myStatusWindowPhase.graphics.font = ScriptUI.newFont("dialog", "Bold", 12);
	myStatusWindowPhase.graphics.foregroundColor = myStatusWindowPhase.graphics.newPen(myStatusWindowPhase.graphics.PenType.SOLID_COLOR, myHeaderColor, 1);
	
	// Основной объект и градусник
	myStatusWindowObject = myDisplayZone.add("statictext", undefined, "");
	myStatusWindowObject.alignment = ["fill", "top"];
	myStatusWindowObject.justify = "left";
	myStatusWindowObject.graphics.font = mySmallFont;
	
	myStatusWindowGauge = myDisplayZone.add ("progressbar", undefined, 0, 100);
	
	// Вспомогательный объект и градусник
	myStatusWindowSubObject = myDisplayZone.add("statictext", undefined, "");
	myStatusWindowSubObject.alignment = ["fill", "top"];
	myStatusWindowSubObject.justify = "left";
	myStatusWindowSubObject.graphics.font = mySmallFont;
	
	myStatusWindowSubGauge = myDisplayZone.add ("progressbar", undefined, 0, 100);
	
	// Область отображения кнопок
	var myButtonsGroup = myStatusWindow.add("group");
	myButtonsGroup.orientation = "column";
	myButtonsGroup.alignment = ["right", "bottom"];
	
	// Кнопки окошка
	var myCancelButton = myButtonsGroup.add("button", undefined, "Отмена", {name: "cancel"});
	myCancelButton.onClick = function() {
		myFlagStopExecution = true;
	}
	
	return true;
}

// Покажем статус в окне с градусником
// ------------------------------------------------------
function showStatus(myPhase, myObject, myGaugeCurrent, myGaugeMax, mySubObject, mySubGaugeCurrent, mySubGaugeMax) {
	if (!myStatusWindow.visible) myStatusWindow.show();
	
	// Обновим что нужно
	if (myPhase != undefined) myStatusWindowPhase.text = myPhase;
	if (myObject != undefined) myStatusWindowObject.text = myObject;
	if (myGaugeCurrent != undefined) myStatusWindowGauge.value = myGaugeCurrent;
	if (myGaugeMax != undefined) myStatusWindowGauge.maxvalue = myGaugeMax;
	if (mySubObject != undefined) myStatusWindowSubObject.text = mySubObject;
	if (mySubGaugeCurrent != undefined) myStatusWindowSubGauge.value = mySubGaugeCurrent;
	if (mySubGaugeMax != undefined) myStatusWindowSubGauge.maxvalue = mySubGaugeMax;
	
	// Проверим очередь событий и отрисуем окошко
	myStatusWindow.update();
}

// Спрячем окно с градусником
// ------------------------------------------------------
function hideStatus() {
	// Очистим окошко
	myStatusWindowPhase.text = "";
	myStatusWindowObject.text = "";
	myStatusWindowOperation.text = "";
	myStatusWindowGauge.value = 0;
	myStatusWindowGauge.maxvalue = 1;
	myStatusWindowSubObject.text = "";
	myStatusWindowSubGauge.value = 0;
	myStatusWindowSubGauge.maxvalue = 1;
	
	myStatusWindow.update();
	myStatusWindow.hide();
}

// Проверим документ и линки
// ------------------------------------------------------
function checkDocumentStatus() {
	if (app.documents.length == 0) {
		alert("Невозможно работать в таких условиях.\nДля начала откройте хотя бы документ, что-ли.");
		return false;
	}
	
	myDocument = app.activeDocument;
	
	// Проверим статус линков
	var myLinksNormal = 0;
	var myLinksOutOfDate = 0;
	var myLinksMissing = 0;
	var myLinksEmbedded = 0;
	
	for (i = 0; i < myDocument.links.length; i++) {
		switch (myDocument.links[i].status) {
			case LinkStatus.NORMAL:
				myLinksNormal++;
				break;
			case LinkStatus.LINK_OUT_OF_DATE:
				myLinksOutOfDate++;
				break;
			case LinkStatus.LINK_MISSING:
				myLinksMissing++;
				break;
			case LinkStatus.LINK_EMBEDDED:
				myLinksEmbedded++;
				break;
			default:
				break;
		}
	}
	
	if (myLinksMissing > 0) {
		alert("В документе есть отсутствующие картинки.\nПоковыряйтесь с палитрой Links, или поудаляйте эти картинки, чтоб не мешались, а потом можно будет продолжить.");
		return false;
	}
	
	if (myLinksOutOfDate > 0) {
		if (!confirm("В документе есть необновлённые картинки.\nОбновить их и продолжить?"))
			return false;
		
		showStatus("ОБНОВЛЕНИЕ КАРТИНОК", " ", " ", 0, myLinksOutOfDate);
		
		for (i = 0; i < myDocument.links.length; i++) {
			if (myDocument.links[i].status == LinkStatus.LINK_OUT_OF_DATE) {
				showStatus(undefined, myDocument.links[i].name, undefined, myStatusWindowGauge.maxvalue - myLinksOutOfDate, undefined);
				if (myFlagStopExecution) return false;
				myDocument.links[i].update();
				myLinksOutOfDate--;
				myLinksNormal++;
			};
		};
		
		showStatus(undefined, undefined, undefined, myStatusWindowGauge.maxvalue, myStatusWindowGauge.maxvalue);
		hideStatus();
	}
	
	if (myLinksNormal == 0) {
		alert("В документе нет подцепленных картинок.\nПопробуйте смеха ради добавить в документ каких-нибудь там джепегов на 900 точек, и тогда можно будет продолжить.");
		return false;
	}
	
	// Проверим, сохранён ли документ
	if (myDocument.modified) {
		if (!confirm("Документ изменён с момента последнего сохранения.\nЧтобы продолжить выполнение скрипта, документ необходимо сохранить.\n\nСохранить и продолжить?"))
			return false;
		myDocument.save();
	}
	
	return true;
}

// Покажем диалог с настройками
// ------------------------------------------------------
function displayPreferences() {
	// Собираем диалоговое окно
	var myDialog = new Window("dialog", "Параметры");
	
	// Константы
	var myPanelWidth = 400;
	var mySubPanelMargins = [14, 14, 10, 10];
	var mySubControlMargins = [18, 0, 0, 0];
	var myStatusPanelMargins = [10, 10, 10, 10];
	var mySubControlWidth = 300;
	
	// Поехали
	var myCommonGroup = myDialog.add("group");
	myCommonGroup.orientation = "row";
	
	var myParametersGroup = myCommonGroup.add("group");
	myParametersGroup.orientation = "column";
	myParametersGroup.minimumSize.width = myPanelWidth;
	myParametersGroup.alignChildren = ["fill", "top"];
	
	// Группа изменения формата
	with (myParametersGroup.add("panel", undefined, "Формат файлов")) {
		orientation = "column";
		minimumSize.width = myPanelWidth;
		alignChildren = ["fill", "top"];
		margins = mySubPanelMargins;
		
		var myChangeFormat = add("checkbox", undefined, "JPEG, PNG и т.п. в TIFF");
		myChangeFormat.onClick = function() {
			myPreferences["changeFormat"] = myChangeFormat.value;
			myChangeFormatGroup.enabled = myChangeFormat.value;
		}
		myChangeFormat.value = myPreferences["changeFormat"];
		
		var myChangeFormatGroup = add("group");
		myChangeFormatGroup.orientation = "column";
		myChangeFormatGroup.alignChildren = ["left", "top"];
		myChangeFormatGroup.margins = mySubControlMargins;
		
		with (myChangeFormatGroup.add("group")) {
			orientation = "column";
			alignChildren = ["fill", "top"];
			
			var myClippedImagesToPSD = add("checkbox", undefined, "С обтравкой в PSD");
			myClippedImagesToPSD.onClick = function() {
				myPreferences["clippedImagesToPSD"] = myClippedImagesToPSD.value;
				myClippingGroup.enabled = myClippedImagesToPSD.value;
			}
			myClippedImagesToPSD.value = myPreferences["clippedImagesToPSD"];
			
			var myClippingGroup = add("group");
			with (myClippingGroup) {
				orientation = "column";
				alignChildren = ["fill", "top"];
				margins = mySubControlMargins;
				
				var myRemoveClipping = add("checkbox", undefined, "Убрать обтравку");
				myRemoveClipping.onClick = function() {
					myPreferences["removeClipping"] = myRemoveClipping.value;
				}
				myRemoveClipping.value = myPreferences["removeClipping"];
			}
		
			var myDeleteOriginals = add("checkbox", undefined, "Удалять оригиналы изображений");
			myDeleteOriginals.onClick = function() {
				myPreferences["deleteOriginals"] = myDeleteOriginals.value;
			}
			myDeleteOriginals.value = myPreferences["deleteOriginals"];
		}
	}
	
	// Группа изменения разрешения
	with (myParametersGroup.add("panel", undefined, "Разрешение (dpi)")) {
		orientation = "row";
		minimumSize.width = myPanelWidth;
		alignChildren = ["left", "bottom"];
		margins = mySubPanelMargins;
		
		with (add("group")) {
			orientation = "column";
			alignChildren = ["left", "top"];
			minimumSize.width = myPanelWidth / 4;
			
			var myUpsample = add("checkbox", undefined, "Увеличивать");
			myUpsample.onClick = function() {
				myPreferences["upsample"] = myUpsample.value;
				myUpsampleThreshold.enabled = myUpsample.value;
			}
			myUpsample.value = myPreferences["upsample"];
			
			var myUpsampleThreshold = add("edittext");
			myUpsampleThreshold.characters = 6;
			myUpsampleThreshold.text = myPreferences["upsampleThreshold"];
			myUpsampleThreshold.justify = "right";
			myUpsampleThreshold.onChange = function() {
				if (parseInt(myUpsampleThreshold.text) >= parseInt(myTargetDPI.text)) {
					alert("Логическая ошибка.\nЖелаемое разрешение должно быть больше нижнего порога.");
					myUpsampleThreshold.text = myPreferences["upsampleThreshold"];
					return;
				}
				myPreferences["upsampleThreshold"] = parseInt(myUpsampleThreshold.text);
			}
		}
		
		with (add("group")) {
			orientation = "column";
			alignChildren = ["center", "top"];
			
			with (add("statictext", undefined, "<")) {
				justify = "center";
			}
		}
		
		with (add("group")) {
			orientation = "column";
			alignChildren = ["left", "top"];
			minimumSize.width = myPanelWidth / 4;
			
			with (add("statictext", undefined, "Желаемое")) {
				justify = "left";
			}
			
			var myTargetDPI = add("edittext");
			myTargetDPI.characters = 6;
			myTargetDPI.text = myPreferences["targetDPI"];
			myTargetDPI.justify = "right";
			myTargetDPI.onChange = function() {
				if (parseInt(myUpsampleThreshold.text) >= parseInt(myTargetDPI.text)) {
					alert("Логическая ошибка.\nЖелаемое разрешение должно быть больше нижнего порога.");
					myTargetDPI.text = myPreferences["targetDPI"];
					return;
				}
				if (parseInt(myTargetDPI.text) >= parseInt(myDownsampleThreshold.text)) {
					alert("Логическая ошибка.\nЖелаемое разрешение должно быть меньше верхнего порога.");
					myTargetDPI.text = myPreferences["targetDPI"];
					return;
				}
				myPreferences["targetDPI"] = parseInt(myTargetDPI.text);
			}
		}
		
		with (add("group")) {
			orientation = "column";
			alignChildren = ["center", "top"];
			
			with (add("statictext", undefined, "<")) {
				justify = "left";
			}
		}
		
		with (add("group")) {
			orientation = "column";
			alignChildren = ["left", "top"];
			minimumSize.width = myPanelWidth / 4;
			
			var myDownsample = add("checkbox", undefined, "Уменьшать");
			myDownsample.onClick = function() {
				myPreferences["downsample"] = myDownsample.value;
				myDownsampleThreshold.enabled = myDownsample.value;
			}
			myDownsample.value = myPreferences["downsample"];
			
			var myDownsampleThreshold = add("edittext");
			myDownsampleThreshold.characters = 6;
			myDownsampleThreshold.text = myPreferences["downsampleThreshold"];
			myDownsampleThreshold.justify = "right";
			myDownsampleThreshold.onChange = function() {
				if (parseInt(myTargetDPI.text) >= parseInt(myDownsampleThreshold.text)) {
					alert("Логическая ошибка.\nЖелаемое разрешение должно быть меньше верхнего порога.");
					myDownsampleThreshold.text = myPreferences["downsampleThreshold"];
					myDownsampleThreshold.active = false;
					myDownsampleThreshold.active = true;
					return;
				}
				myPreferences["downsampleThreshold"] = parseInt(myDownsampleThreshold.text);
			}
		}
		
		
		
	}
	
	// Группа выбора области деятельности
	var myScopeGroup = myParametersGroup.add("panel", undefined, "Область действия");
	with (myScopeGroup) {
		orientation = "row";
		minimumSize.width = myPanelWidth;
		alignChildren = ["fill", "fill"];
		margins = mySubPanelMargins;
	}
	
	var myScopeRadioGroup = myScopeGroup.add("group");
	with (myScopeRadioGroup) {
		orientation = "column";
		//minimumSize.width = myPanelWidth;
		alignChildren = ["fill", "top"];
	}
	
	var myAllDocsCode = 0;
	var myActiveDocCode = 1;
	var mySelectedPagesCode = 2;
	var mySelectedImagesCode = 3;
	var myScopeOptions = [
		[myAllDocsCode, "Все открытые документы"], // Code, UI text
		[myActiveDocCode, "Активный документ"],
		[mySelectedPagesCode, "Выбранные страницы"],
		[mySelectedImagesCode, "Выбранные изображения"]];
	
	function myButtonClicked() {
		for (var i = 0; i < myScopeRadioGroup.children.length; i++)
			if (myScopeRadioGroup.children[i].value == true) {
				myPreferences["scope"] = i;
				while (myItemsList.items.length > 0) {
					myItemsList.remove(myItemsList.items[0]);
				}
				if (i == myAllDocsCode) {
					myScopeItemsGroup.enabled = true;
					myDocuments = app.documents;
					for (n = 0; n < myDocuments.length; n++) {
						myItemsList.add("item", myDocuments[n].name, n);
						myItemsList.selection = n;
					}
				} else if (i == myActiveDocCode) {
					myDocument = app.activeDocument;
					myScopeItemsGroup.enabled = false;
				} else if (i == mySelectedPagesCode) {
					myDocument = app.activeDocument;
					myScopeItemsGroup.enabled = true;
					for (n = 0; n < myDocument.pages.length; n++) {
						myItemsList.add("item", myDocument.pages[n].name, n);
						myItemsList.selection = n;
					}
				} else if (i == mySelectedImagesCode) {
					myScopeItemsGroup.enabled = true;
					
				}
			}
	}
	
	for (var i = 0; i < myScopeOptions.length; i++) {
		var myButton = myScopeRadioGroup.add("radiobutton", undefined, myScopeOptions[i][1]);
		myButton.value = (i == myActiveDocCode);
		myButton.onClick = myButtonClicked;
	}
	
	var myScopeItemsGroup = myScopeGroup.add("group");
	with (myScopeItemsGroup) {
		orientation = "column";
		minimumSize.width = 180;
		alignChildren = ["fill", "fill"];
	}
	
	var myItemsList = myScopeItemsGroup.add("listbox", undefined, undefined, {multiselect: true});
	
	
	
	// Группа резервного копирования
	with (myParametersGroup.add("panel", undefined, "Резервное копирование")) {
		orientation = "column";
		minimumSize.width = myPanelWidth;
		alignChildren = ["fill", "top"];
		margins = mySubPanelMargins;
		
		var myDoBackup = add("checkbox", undefined, "Резервное копирование");
		myDoBackup.onClick = function() {
			myPreferences["backup"] = myDoBackup.value;
			myBackupGroup.enabled = myDoBackup.value;
		}
		myDoBackup.value = myPreferences["backup"];
		
		var myBackupGroup = add("group");
		myBackupGroup.orientation = "row";
		myBackupGroup.alignChildren = ["fill", "top"];
		myBackupGroup.margins = mySubControlMargins;

		
		with (myBackupGroup.add("group")) {
			orientation = "row";
			alignChildren = ["fill", "top"];
			
			var myBackupPath = add("edittext", undefined, myPreferences["backupFolder"]);
			myBackupPath.preferredSize.width = mySubControlWidth;
		}
			
		with (myBackupGroup.add("group")) {
			orientation = "row";
			alignChildren = ["right", "top"];
			
			var myBackupChooseButton = add("button", undefined, "Выбрать");
			myBackupChooseButton.onClick = function() {
				var mySelectedFolder = Folder.selectDialog();
				if (mySelectedFolder != null) {
					myPreferences["backupFolder"] = mySelectedFolder.fullName + "/";
					myBackupPath.text = mySelectedFolder.fullName + "/";
				}
			}
		}
	}
	
	// Группа кнопок диалогового окна
	var myButtonsGroup = myCommonGroup.add("group");
	myButtonsGroup.orientation = "column";
	myButtonsGroup.alignment = ["right", "top"];
	
	myButtonsGroup.add("button", undefined, "OK", {name: "ok"});
	myButtonsGroup.add("button", undefined, "Отмена", {name: "Cancel"});
	
	// Отработать включение/выключение групп
	myChangeFormat.onClick();
	myClippedImagesToPSD.onClick();
	myDoBackup.onClick();
	myDownsample.onClick();
	myUpsample.onClick();
	myScopeRadioGroup.children[0].onClick();
	
	// Показать диалог и, если всё хорошо, сохранить настройки
	if (myDialog.show() == 1) {
		var myPreferencesArray = [];
		for (i in myPreferences)
			myPreferencesArray.push(i + "\t" + typeof myPreferences[i] + "\t" + myPreferences[i]);
		
		var myPreferencesFile = new File(myPreferencesFileName);
		if (myPreferencesFile.open("w"))
			if (myPreferencesFile.write(myPreferencesArray.join("\n")))
				if (myPreferencesFile.close())
					return true;
		alert("Ошибка при сохранении настроек.\nВообще такого не должно было случиться, поэтому на всякий случай дальнейшее выполнение скрипта отменяется.");
		return false;
	} else {
		return false;
	}
}

// Разберём имеющиеся в документе картинки
// ------------------------------------------------------
function selectImages() {
	// Получим список картинок
	var myGraphics = myDocument.allGraphics;
	
	// Функция проверки: надо ли вообще что либо делать с картинкой
	function checkGraphic(myGraphic) {
		myDoProcess = false;
		
		if ((myPreferences["changeFormat"]) && (wrongGraphicFormat(myGraphic))) { myDoProcess = true }
		if ((myPreferences["upsample"]) && (lowGraphicDPI(myGraphic))) { myDoProcess = true }
		if ((myPreferences["downsample"]) && (highGraphicDPI(myGraphic))) { myDoProcess = true }
		
		return myDoProcess;
	}
	
	// Составим список картинок, нуждающихся в обработке
	for (var i = myGraphics.length-1; i >= 0; i--) {
		if (checkGraphic(myGraphics[i])) {
			myGraphicsList.push(myGraphics[i]);
		}
	}
	
	//alert(myGraphicsList);
	return true;
}

// Сохраним оригиналы картинок
// ------------------------------------------------------
function backupImages() {
	// Надо?
	if (!myPreferences["backup"])
		return true;
	
	// Сделаем папку для бэкапа
	var myDate = new Date();
	var myBackupFolderName = myDocument.name + "-" + myDate.getFullYear() + "-" + fillZeros(myDate.getMonth()+1, 2) + "-" + fillZeros(myDate.getDate(), 2) + "-" + fillZeros(myDate.getHours(), 2) + fillZeros(myDate.getMinutes(), 2) + fillZeros(myDate.getSeconds(), 2);
	var myBackupFolder = new Folder(myPreferences["backupFolder"] + myBackupFolderName);
	if (!myBackupFolder.create()) {
		alert("Ошибка при создании папки резервных копий\nПроверьте правильность пути, слэш на конце, права доступа и т.п.");
		return false;
	}
	
	showStatus("РЕЗЕРВНОЕ КОПИРОВАНИЕ", myDocument.name, " ", 0, myGraphicsList.length);
	
	// Вместе с картинками (чего уж там) сохраним и .indd документ
	if (!myDocument.fullName.copy(uniqueFileName(myBackupFolder.fullName, myDocument.name))) {
		alert("Ошибка при резервном копировании файла\n" + myDocument.name + "\n\nПроверьте права доступа, свободное место и т.п.");
		return false;
	}
	
	// Скопируем оригиналы
	var myFile;
	for (var i = 0; i < myGraphicsList.length; i++) {
		showStatus(undefined, myGraphicsList[i].itemLink.name, undefined, i, undefined);
		myFile = new File(myGraphicsList[i].itemLink.filePath);
		if (!myFile.copy(uniqueFileName(myBackupFolder.fullName, myGraphicsList[i].itemLink.name))) {
			alert("Ошибка при резервном копировании файла\n" + myGraphicsList[i].itemLink.filePath + "\n\nПроверьте права доступа, свободное место и т.п.");
			return false;
		}
		if (i+1 < myGraphicsList.length)
			showStatus(undefined, myGraphicsList[i+1].itemLink.name, undefined, i+1, undefined);
	}
	
	showStatus(undefined, undefined, undefined, myStatusWindowGauge.maxvalue, myStatusWindowGauge.maxvalue);
	hideStatus();
	
	return true;
}

// Обработаем картинки
// ------------------------------------------------------
function processImages() {
	var myPSScript = "";
	var myGraphic;
	var myOriginalFile;
	
	showStatus("ОБРАБОТКА ИЗОБРАЖЕНИЙ", myDocument.name, " ", 0, myGraphicsList.length);
	
	// Функция для передачи в Фотошоп
	function bridgeFunction(myFilePath, myDoUpsample, myDoDownsample, myDoChangeFormat) {
		var mySavedDisplayDialogs = app.displayDialogs;
		app.displayDialogs = DialogModes.NO;
		
		try {
			var myFileRef = new File(myFilePath);
			var myDocument = app.open(myFileRef);
			if (myDocument == null)
				throw X_BADDOC;
			
			myDocument.close(SaveOptions.SAVECHANGES);
		} catch (e) {
			//throw e;
			$.writeln("error catched");
			var myBT = new BridgeTalk;
			myBT.target = "indesign";
			myBT.body = e.description;
			myBT.body = e.toString();
			myBT.body = e.toSource();
			myBT.send();
		} finally {
			app.displayDialogs = mySavedDisplayDialogs;
		}
	}
	
	// Поехали
	for (var i = 0; i < myGraphicsList.length; i++) {
		myGraphic = myGraphicsList[i];
		
		showStatus(undefined, myGraphic.itemLink.name, undefined, i, undefined);
		
		// Параметры скрипта для Фотошопа
		myDoUpsample = (myPreferences["upsample"]) && (lowGraphicDPI(myGraphic));
		myDoDownsample = (myPreferences["downsample"]) && (highGraphicDPI(myGraphic));
		myDoChangeFormat = (myPreferences["changeFormat"]) && (wrongGraphicFormat(myGraphic));
		
		// Запускаем скрипт в фотошопе
		var myReturnValue = true;
		var myReturnMessage = "";
		
		try {
			if (!BridgeTalk.isRunning("photoshop")) {
				BridgeTalk.launch("photoshop");
			}
			//BridgeTalk.bringToFront("photoshop");
			
			// Функция приёма сообщений фотошоповского скрипта
			BridgeTalk.onReceive = function(myMessage) {
				if (myMessage.body.length != 0) {
					$.writeln("onReceive +: " + eval(myMessage.body));
					myReturnMessage = eval(myMessage.body);
					myReturnValue = false;
				} else {
					// Пустое сообщение: нормальное завершение скрипта
					$.writeln("onReceive 0: received 'undefined' message");
				}
			}
			
			var myBT = new BridgeTalk;
			myBT.target = "photoshop";
			myBT.body = bridgeFunction.toString() + "\r\rbridgeFunction(\"";
			myBT.body += myGraphic.itemLink.filePath + "\", ";
			myBT.body += myDoUpsample + ", ";
			myBT.body += myDoDownsample + ", ";
			myBT.body += myDoChangeFormat;
			myBT.body += ");";
			myBT.onError = function(obj) {
				alert("Фотошоп сообщил об ошибке:\n" + myGraphic.itemLink.filePath + "\n\n" + obj.body);
				myReturnValue = false;
			}
			myBT.onResult = function(obj) {
				$.writeln("onResult: " + obj.body);
			}
			myBT.onTimeout = function(obj) {
				$.writeln("onTimeout: " + obj.body);
			}
			myBT.send(180);
		} catch (error) {
			alert("Ошибка при обработке изображения\n" + myGraphic.itemLink.filePath + "\n\n" + error);
			return false;
		}
		
		$.writeln("myReturnValue: " + myReturnValue);
		
		if (!myReturnValue) {
			alert("Ошибка при обработке изображения\n" + myGraphic.itemLink.filePath + "\n\n" + myReturnMessage);
			return false;
		}
		
		// Меняли формат изображения?
		if (myDoChangeFormat) {
			// Перелинковать на новый файл
			myOriginalFile = new File(myGraphic.itemLink.filePath);
			//myGraphic.itemLink.filePath = 
			
			// Удалить исходник?
			if (myPreferences["deleteOriginals"]) {
				//myOriginalFile.remove();
			}
		} else {
			// Обновить линк
			myGraphic.itemLink.update();
		}
		
		
		//alert("Скрипт:\n\n" + myPSScript);
		//return false;
		
		if (i+1 < myGraphicsList.length)
			showStatus(undefined, myGraphicsList[i+1].itemLink.name, undefined, i+1, undefined);
	}
	
	showStatus(undefined, undefined, undefined, myStatusWindowGauge.maxvalue, myStatusWindowGauge.maxvalue);
	hideStatus();
	
	return true;
}

// Проверка картинки на кривость формата файла
// ------------------------------------------------------
function wrongGraphicFormat(myGraphic) {
	if (myGraphic.imageTypeName in {"JPEG":0, "PNG":0, "Windows Bitmap":0, "CompuServe GIF":0}) {
		return true;
	}
	return false;
}

// Проверка картинки на низкое dpi
// ------------------------------------------------------
function lowGraphicDPI(myGraphic) {
	try {
		if ((myGraphic.effectivePpi[0] > myPreferences["upsampleThreshold"]) || (myGraphic.effectivePpi[1] > myPreferences["upsampleThreshold"])) {
			return true;
		}
	} catch (e) {}
	return false;
}

// Проверка картинки на высокое dpi
// ------------------------------------------------------
function highGraphicDPI(myGraphic) {
	try {
		if ((myGraphic.effectivePpi[0] < myPreferences["downsampleThreshold"]) || (myGraphic.effectivePpi[1] < myPreferences["downsampleThreshold"])) {
			return true;
		}
	} catch (e) {}
	return false;
}

// Посчитать картинки с кривым форматом
// ------------------------------------------------------
function wrongGraphicFormatCount() {
	var myGraphics = myDocument.allGraphics;
	var myCount = 0;
	
	for (var i = myGraphics.length-1; i >= 0; i--)
		if (wrongGraphicFormat(myGraphics[i]))
			myCount++;
	
	return myCount;
}

// Посчитать картинки с слишком низким разрешением
// ------------------------------------------------------
function tooLowDPICount() {
	var myGraphics = myDocument.allGraphics;
	var myCount = 0;
	
	for (var i = myGraphics.length-1; i >= 0; i--) {
		if (lowGraphicDPI(myGraphics[i]))
			myCount++;
	}
	
	return myCount;
}

// Посчитать картинки с слишком высоким разрешением
// ------------------------------------------------------
function tooHighDPICount() {
	var myGraphics = myDocument.allGraphics;
	var myCount = 0;
	
	for (var i = myGraphics.length-1; i >= 0; i--) {
		if (highGraphicDPI(myGraphics[i]))
			myCount++;
	}
	
	return myCount;
}



// Доливка нулями
// ------------------------------------------------------
function fillZeros(myNumber, myMinDigits) {
	var myString = new String(myNumber);
	while (myString.length < myMinDigits)
		myString = "0" + myString;
	return myString;
}

// Получим уникальное имя файла
// ------------------------------------------------------
function uniqueFileName(myFolderName, myFileName) {
	var myFile = new File(myFolderName + "/" + myFileName);
	var i = 1;
	while (myFile.exists) {
		myFile = new File(myFolderName + "/" + myFileName.substr(0, myFileName.lastIndexOf(".")) + " " + i + myFileName.substr(myFileName.lastIndexOf("."), myFileName.length));
		i++;
	}
	return myFile;
}

// Дебаг
// ------------------------------------------------------
function debugPrintObject(f) {
	$.writeln("\n\n" + f.reflect.name + "\n----------------------------------------------------------");
	var props = f.reflect.properties;
	var array = [];
	for (var i = 0; i < props.length; i++)
		try {array.push(props[i].name + ": " + f[props[i].name])} catch (_){}
	array.sort();
	$.writeln(array.join("\r"));
	
	$.writeln("\rMethods");
	for (var i = 0; i < props.length; i++)
		$.writeln (props[i].name);
}
