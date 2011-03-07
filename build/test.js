var
	str = 'floatingmenu.tab.format=Форматирование\nfloatingmenu.tab.insert=Вставить\nyes=Да\nno=Нет\ncancel=Отмена',
	lines = str.split(/\r\n|\r|\n/),
	result = lines.join('\n');

console.log(result);
