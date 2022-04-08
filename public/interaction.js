function editAdmin(element) {
	let id = element.id;
	document.adminListForm.edit_id.value = id;
	document.adminListForm.submit();
}

function editTeacher(element) {
	let id = element.id;
	document.teacherListForm.edit_id.value = id;
	document.teacherListForm.submit();
}

function saveAttendance() {
	let numbers = [];
	let checkboxes = document.getElementsByClassName("attendance-box");
	for (let box of checkboxes) {
		if (box.checked) numbers.push(parseInt(box.name));
	}
	let json = '[' + numbers.toString() + ']';
	document.attendanceForm.numbers.value = json;
	document.attendanceForm.submit();
}

function submitLogin() {
	let valid = true;
	if (document.loginform) {
		let inputs = [...document.loginform.getElementsByTagName('input')];
		inputs.forEach((element) => {
			if (element.required && !element.value) {
				element.classList.add('invalid');
				element.placeholder = "Field cannot be empty!";
				valid = false;
			} else {
				element.classList.remove('invalid');
			}
		});
		if (valid) {
			document.loginform.submit();
			console.log('Logging in...');
		}
		else return;
	} else console.log('Error: Form not found!');
}

function switchTheme() {
    if (document.body.classList.contains('light')) {
        document.body.classList.replace('light', 'dark');
		window.localStorage.theme = 'dark';
    } else {
        if (document.body.classList.contains('dark')) {
            document.body.classList.replace('dark', 'light');
			window.localStorage.theme = 'light';
		} else {
			document.body.classList.add('light');
			window.localStorage.theme = 'light';
		}
    }
}

window.addEventListener('load', () => {
	if (window.localStorage.theme) {
		if (window.localStorage.theme == 'dark')
			document.body.classList.add('dark');
		else if (window.localStorage.them == 'light')
			document.body.classList.add('light');
		else {
			document.body.classList.add('light');
			window.localStorage.theme = 'light';
		}
	} else {
		document.body.classList.add('light');
		window.localStorage.theme = 'light';
	}
	document.body.style.transition = "color 0.5s, background-color 0.5s";
});