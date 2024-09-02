(() => {
  const page = document.querySelector('.page');
  const headerForm = document.getElementById('headerForm');
  const searchInput = document.getElementById('search');
  const searchBtn = document.getElementById('searchBtn');
  const searchList = document.getElementById('searchList');

  const url = new URL('http://localhost:3000/api/clients');

  let scrollPosition;
  let contactsArr = [];
  let count = -1;

  async function getData(url) {
    try {
      const response = await fetch(url);
      const result = await response.json();

      if (response.status === 404 || response.status === 422) {
        const dialogEr = createModalError(result.message);
        openModal(dialogEr);
      } else if (response.status === 200 || response.status === 201) {
        return result;
      } else {
        const dialogEr500 = createModalError500('Что-то пошло не так...');
        openModal(dialogEr500);
      }
    } catch {
      const dialogEr500 = createModalError500('Сервер временно недоступен, попробуйте зайти позже');
      openModal(dialogEr500);
    }
  }

  (async function checkClientsList() {
    const response = await fetch(url);

    const loader = createBlankWhithLoader();
    tableBody.append(loader);

    const reader = response.body.getReader();

    let chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        loader.remove();
        break;
      }
      chunks.push(value);
    }

    const blob = new Blob(chunks);
    let result = await blob.text();
    result = JSON.parse(result);

    if (result !== '' && result !== null) {
      result.forEach(client => tableBody.append(renderClientItem(client)));
    }
  })();

  async function sendData(data) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      return checkResponseStatus(response, result);
    } catch(e) {
      const dialogEr500 = createModalError500('Сервер временно недоступен, попробуйте зайти позже');
      openModal(dialogEr500);
    }
  }

  async function replaceClientOnServer(obj) {
    try {
      const response = await fetch(`${url}/${obj.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj),
      });

      const result = await response.json();

      return checkResponseStatus(response, result);
    } catch(e) {
      const dialogEr500 = createModalError500('Сервер временно недоступен, попробуйте зайти позже');
      openModal(dialogEr500);
    }
  }

  function checkResponseStatus(response, result) {
    if (response.status === 404 || response.status === 422) {
      return result.errors.map(er => er.message);
    } else if (response.status === 200 || response.status === 201) {
      return result;
    } else {
      return 'Что-то пошло не так...';
    }
  }

  async function deleteClient(clientOfDel) {
    await fetch(`${url}/${clientOfDel.id}`, {
      method: 'DELETE',
    });

    const elOfDel = document.getElementById(clientOfDel.id);
    elOfDel.remove();
  }

  function ctreateTooltip(type, value) {
    const tooltip = document.createElement('div');
    const tooltipValue = document.createElement('span');
    tooltip.classList.add('tooltip');
    tooltipValue.textContent = value;

    if (type === null) {
      tooltip.append(tooltipValue);
    } else {
      const tooltipType = document.createElement('span');
      tooltipType.classList.add('tooltip__type');
      tooltipType.textContent = `${type}:`;
      tooltip.append(tooltipType, tooltipValue);
    }

    return tooltip;
  }

  function createBlankWhithLoader() {
    const blank = document.createElement('tr');
    const cell = document.createElement('td');
    const preloader = document.createElement('span');

    blank.id = 'blank';
    cell.colSpan = '6';

    cell.classList.add('table__blank');
    preloader.classList.add('loader');

    cell.append(preloader);
    blank.append(cell);

    return blank;
  }

  function createLoaderBtn() {
    const loader = document.createElement('span');
    loader.id = 'loader';
    loader.classList.add('btn-spinner', 'btn-spinner_hide');

    return loader;
  }

  function toggleLoader() {
    const loader = document.getElementById('loader');
    loader.classList.toggle('btn-spinner_hide');
  }

  function activeLoaderBtn(svg, btn) {
    const loader = createLoaderBtn();

    svg.remove();
    btn.prepend(loader);
    toggleLoader();

    return loader;
  }

  function createClientsBox() {
    const box = document.createElement('div');
    const table = document.createElement('table');
    const caption = document.createElement('caption');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    const theadRow = document.createElement('tr');

    box.id = 'clientsBox';
    table.id = 'table';
    thead.id = 'tableHeader';
    tbody.id = 'tableBody';
    theadRow.id = 'theadRow';

    caption.textContent = 'Клиенты'

    box.classList.add('flex', 'clients__box');
    table.classList.add('table', 'clients__table');
    caption.classList.add('clients__title');
    thead.classList.add('table__header');
    tbody.classList.add('table__body');
    theadRow.classList.add('table__row', 'table__header-row');

    thead.append(theadRow);
    table.append(caption, thead, tbody);
    box.append(table);

    createContentThead(theadRow);

    return {
      box,
      table,
      caption,
      thead,
      tbody,
      theadRow,
    }
  }

  function createContentThead(theadRow) {
    const columnCountArr = [
      {
        count: 'first',
        title: 'ID'
      },
      {
        count: 'second',
        title: 'Фамилия Имя Отчество'
      },
      {
        count: 'third',
        title: 'Дата и время создания'
      },
      {
        count: 'fourth',
        title: 'Последние изменения'
      },
      {
        count: 'fifth',
        title: 'Контакты'
      },
      {
        count: 'sixth',
        title: 'Действия'
      }
    ];

    for (let i = 1; i <= columnCountArr.length; ++i) {
      const th = document.createElement('th');
      const thTitle = document.createElement('span');
      if (i <= 4) thTitle.classList.add('table__header-title');
      th.append(thTitle);
      theadRow.append(th);
    }

    theadRow.childNodes.forEach((col, indexCol) => {
      columnCountArr.forEach((item, indexStr) => {
        if (indexCol === indexStr) {
          col.classList.add(`${item.count}-col`, 'table__header-cell', 'text-grey');
          col.id = `${item.count}Col`;
          col.querySelector('span').textContent = item.title;
        }
      });
      if (indexCol <= 3) {
        const arrowSvg = createSvgArrow();
        col.tabIndex = 0;
        col.append(arrowSvg);
        col.addEventListener('keydown', (e) => {
          if (e.code === 'Enter') col.click();
        })
      }
      if (col.id === 'secondCol') {
        const svgLetter = createSvgLetter();
        svgLetter.classList.add('table__header-svg');
        col.append(svgLetter);
      }
    });
  }

  function createNewClientBtn() {
    const wrapper = document.createElement('div');
    const btn = document.createElement('button');
    const svgBtn = createSvgNewClientBtn();
    const spanBtn = document.createElement('span');

    wrapper.id = 'clientsNew';
    btn.id = 'clientNewBtn';
    btn.ariaLabel = 'добавить нового клиента'

    wrapper.classList.add('flex', 'clients__new');
    btn.classList.add('flex', 'btn', 'clients__new-btn');

    spanBtn.textContent = 'Добавить клиента';

    btn.append(svgBtn, spanBtn);
    wrapper.append(btn);

    return {
      wrapper,
      btn,
    }
  }

  function createMainContent() {
    const main = document.getElementById('main');
    const h1 = document.createElement('h1');
    const mainBox = document.createElement('div');
    const container = document.createElement('div');
    const clientsBox = createClientsBox();
    const clientNewBtn = createNewClientBtn();

    h1.classList.add('visually-hidden');
    mainBox.classList.add('flex', 'clients');
    container.classList.add('container', 'flex', 'clients__container');

    h1.textContent = 'Skillbus';

    container.append(clientsBox.box);
    mainBox.append(container, clientNewBtn.wrapper);
    main.append(h1, mainBox);

    return {
      mainBox,
      clientsBox,
      clientNewBtn,
    }
  }

  function createDialogForm() {
    const form = document.createElement('form');
    const headerWrapper = document.createElement('div');
    const inputWrapper = document.createElement('div');
    const contactWrapper = document.createElement('div');
    const errorWrapper = document.createElement('div');
    const btnWrapper = document.createElement('div');

    form.novalidate = true;
    form.id = 'formForClient';
    contactWrapper.id = 'contactWrapper';
    errorWrapper.id = 'errorBox';
    btnWrapper.id = 'btnForm';

    form.classList.add('modal__form');
    contactWrapper.classList.add('modal-contact');
    errorWrapper.classList.add('flex', 'error');
    btnWrapper.classList.add('modal__action-btn');

    form.append(headerWrapper, inputWrapper, contactWrapper, errorWrapper, btnWrapper);

    form.childNodes.forEach(item => item.classList.add('flex', 'modal__wrapper'));

    return {
      form,
      headerWrapper,
      inputWrapper,
      contactWrapper,
      errorWrapper,
      btnWrapper,
    }
  }

  function createDialogTitle(title, clientOfChange) {
    const h3 = document.createElement('h3');
    const id = document.createElement('span');

    if (title !== 'Изменить данные') h3.classList.add('sub-title--mb');
    h3.classList.add('sub-title');
    id.classList.add('text-grey');

    h3.textContent = title;

    if (clientOfChange !== null) id.textContent = `ID: ${clientOfChange.id}`;

    return {
      h3,
      id,
    }
  }

  function createDialogCloseBtn() {
    const btn = document.createElement('button');
    const lineOne = document.createElement('span');
    const lineTwo = document.createElement('span');

    btn.type = 'button';

    btn.classList.add('close-btn');
    lineOne.classList.add('close-btn__line');
    lineTwo.classList.add('close-btn__line');

    btn.append(lineOne, lineTwo);

    return btn;
  }

  function createDialogInput(clientOfChange) {
    const box = document.createElement('div');
    const surname = createInput('surname', 'text', 'Фамилия');
    const name = createInput('name', 'text', 'Имя');
    const lastName = createInput('lastName', 'text', 'Отчество');

    surname.input.setAttribute('name', 'surname');
    name.input.setAttribute('name', 'name');
    lastName.input.setAttribute('name', 'lastName');

    if (clientOfChange !== null) {
      surname.input.value = setFirstUpperCase(clientOfChange.surname);
      name.input.value = setFirstUpperCase(clientOfChange.name);
      lastName.input.value = setFirstUpperCase(clientOfChange.lastName);
    }

    box.classList.add('modal__form');
    box.append(surname.div, name.div, lastName.div);

    changeLabelClass(surname);
    changeLabelClass(name);
    changeLabelClass(lastName);
    startCheckValid();

    function startCheckValid() {
      const errorName = 'Ошибка: Не указано имя';
      const errorSurname = 'Ошибка: Не указана фамилия';
      const errorLetters = 'В полях для ФИО допустимо только буквенное обозначение';

      const objValidInput = {
        surnameInvalid: false,
        nameInvalid: false,
        lastNameInvalid: false,
      };

      surname.input.addEventListener('input', () => chekSurnameOrNameInput(surname.input, errorSurname, 'surnameInvalid', errorLetters));

      name.input.addEventListener('input', () => chekSurnameOrNameInput(name.input, errorName, 'nameInvalid', errorLetters));

      lastName.input.addEventListener('input', () => {
        if (lastName.input.value === '') {
          objValidInput.lastNameInvalid = false;
          paramInputValid(lastName.input);
        } else {
          objValidInput.lastNameInvalid = checkLetters(lastName.input);
          if (objValidInput.lastNameInvalid) setError([lastName.input], errorLetters);
        }
      });

      box.addEventListener('input', () => {
        if (!Object.values(objValidInput).some(val => val === true)) removeExcessError([errorLetters]);
      });

      function checkLetters(input) {
        if (input.value === '') return;
        const letters = /^[a-zA-Zа-яёА-ЯЁ]?[a-zA-Zа-яёА-ЯЁ-]+[a-zA-Zа-яёА-ЯЁ]?$/igu;
        const dash = /-{2,}/g;

        if (input.value.match(letters)) {
          if (input.value.match(dash)) {
            paramInputInvalid(input);
            return true;
          } else {
            paramInputValid(input);
            return false;
          }
        } else {
          paramInputInvalid(input);
          return true;
        }
      }

      function chekSurnameOrNameInput(input, inputError, objKey, errorLetters) {
        if (input.value !== '') {
          removeExcessError([inputError]);
          objValidInput[objKey] = checkLetters(input);
          if (objValidInput[objKey]) setError([input], errorLetters);
        } else {
          objValidInput[objKey] = false;
          checkRequired(input);
          setError([input], inputError);
        }
      }
    }

    function changeLabelClass(inputName) {
      inputName.input.value !== '' ?
        inputName.label.classList.add('modal__label-after') :
        inputName.label.classList.remove('modal__label-after');
    }

    return {
      box,
      surname,
      name,
      lastName,
    }
  }

  function createDialogNewContactBtn() {
    const btn = document.createElement('button');
    const spanBtn = document.createElement('span');
    const svgBtn = createNewContactSvg();
    const svgHoverBtn = createNewContactSvgHover();

    btn.classList.add('flex', 'btn', 'modal__btn-new');

    btn.type = 'button';
    spanBtn.textContent = 'Добавить контакт';

    btn.append(svgBtn, spanBtn);

    btn.addEventListener('mouseover', () => svgBtn.replaceWith(svgHoverBtn));
    btn.addEventListener('mouseout', () => svgHoverBtn.replaceWith(svgBtn));

    return btn;
  }

  function eventNewContactBtn(el, btn, wrapper) {
    if (el.children.length >= 9) btn.classList.add('visually-hidden');

    el.classList.add('modal-contact__form');
    wrapper.classList.add('padding--modal-contact');

    const contentForBox = createContentForBoxContacts();

    el.append(contentForBox.wrapper);

    contentForBox.input.focus();
  }

  function createContentForBoxContacts() {
    const wrapper = document.createElement('div');
    const inputWrapper = document.createElement('div');
    const input = document.createElement('input');
    const dropdown = createDropdown();
    const btnDel = createBtnDelContact();

    wrapper.classList.add('flex', 'modal-contact__wrap');
    inputWrapper.classList.add('flex-grow');
    input.classList.add('modal-contact__input');

    input.placeholder = 'Введите данные контакта';
    input.ariaInvalid = 'false';
    input.setAttribute('form', 'formForClient');
    setAttForInput(input, dropdown.dropdownInput.value);

    inputWrapper.append(input);
    wrapper.append(dropdown.dropdown, inputWrapper);

    dropdown.dropdownList.itemArr.forEach((item) => {
      item.addEventListener('click', () => {
        setAttForInput(input, item.textContent);
        input.focus();
      });
    });

    input.addEventListener('input', (e) => {
      (input.value) ? wrapper.append(btnDel) : btnDel.remove();
      startValid();
    });

    dropdown.dropdown.addEventListener('click', (e) => startValid());

    btnDel.addEventListener('click', () => {
      wrapper.remove();
      document.querySelector('button[type="submit"]').focus();
      startValid();
    });

    function startValid() {
      const btnSave = document.getElementById('btnSubmit');
      const errorTel = 'Телефон: номер заполняется цифрами';
      const errorEmail = 'Электронная почта: должно быть ...@xx.xx';
      const errorVk = 'Вконтакте: должно содержать vk.com и быть в URL-формате';
      const errorFb = 'Facebook: должно содержать facebook.com и быть в URL-формате';
      const errorRequaried = 'Ошибка: Не все добавленные контакты полностью заполнены';
      const errorTextArr = [errorTel, errorEmail, errorVk, errorFb];
      const numbReg = /^[\d']+$/igu;
      const emailReg = /^[A-Z0-9._%+-]+@[A-Z0-9-]+.+.[A-Z]{2,4}$/i;
      const fbReg = /(?:http:\/\/)?(?:www\.)?facebook\.com\/(?:(?:\w)*#!\/)?(?:pages\/)?(?:[\w\-]*\/)*([\w\-]*)/
      const vkReg = /(?:http:\/\/)?(?:www\.)?vk.com\/(?:(?:\w)*#!\/)?(?:pages\/)?(?:[\w\-]*\/)*([\w\-]*)/
      const contactsArr = Array.from(document.querySelectorAll('.modal-contact__input'));

      if (!contactsArr.some(contact => contact.value === '')) removeExcessError([errorRequaried]);

      switch (input.ariaLabel) {
        case 'Телефон клиента':
          if (checkValidContactValue(numbReg, input)) createErrorContact(errorTel);
          break;
        case 'Электронная почта клиента':
          if (checkValidContactValue(emailReg, input)) createErrorContact(errorEmail);
          break;
        case 'Клиент в социальной сети Вконтакте':
          if (checkValidContactValue(vkReg, input)) createErrorContact(errorVk);
          break;
        case 'Клиент в социальной сети Facebook':
          if (checkValidContactValue(fbReg, input)) createErrorContact(errorFb);
          break;
      }

      const errorArr = Array.from(document.querySelectorAll('.modal-contact__input'))
        .filter(el => el.ariaInvalid === 'true')
        .map((b) => {
          switch (b.ariaLabel) {
            case 'Телефон клиента':
              return b = errorTel;
            case 'Электронная почта клиента':
              return b = errorEmail;
            case 'Клиент в социальной сети Вконтакте':
              return b = errorVk;
            case 'Клиент в социальной сети Facebook':
              return b = errorFb;
          }
        });

      const totalErrorArr = new Set(errorTextArr);
      const currentErrorArr = new Set(errorArr);

      const arrErrorForDelete = Array.from(totalErrorArr.difference(currentErrorArr));

      removeExcessError(arrErrorForDelete);

      setDisabledForBtn(btnSave);

      function checkValidContactValue(reg, input) {
        if (input.value.match(reg) || input.value === '') {
          input.ariaInvalid = 'false';
          input.classList.remove('modal-contact__invalid');
          return false;
        } else {
          input.ariaInvalid = 'true';
          input.classList.add('modal-contact__invalid');
          return true;
        }
      }

      function createErrorContact(errorText) {
        const errorBox = document.getElementById('errorBox');
        if (errorBox.innerHTML.includes(errorText)) return;
        const errorDescr = document.createElement('span');
        errorBox.prepend(errorDescr);
        errorDescr.textContent = errorText;
      }
    }

    return {
      wrapper,
      dropdown,
      btnDel,
      input,
    }
  }

  function createBtnDelContact() {
    const btnDel = document.createElement('div');
    const spanBtnDel = document.createElement('span');
    const svgDel = createSvgDeleteBtn();
    const tooltipDel = ctreateTooltip(null, 'Удалить контакт');

    btnDel.classList.add('btn', 'modal-contact__btn');
    spanBtnDel.classList.add('relative');
    svgDel.classList.add('modal__deletesvg');

    spanBtnDel.append(svgDel, tooltipDel);
    btnDel.append(spanBtnDel);

    return btnDel;
  }

  function createDropdown() {
    const typeContact = ['Телефон', 'Email', 'Facebook', 'VK', 'Другое'];

    const dropdown = document.createElement('div');
    const dropdownInput = document.createElement('input');

    dropdown.classList.add('dropdown');
    dropdownInput.classList.add('dropdown__input');
    dropdownInput.type = 'text';
    dropdownInput.value = 'Телефон';
    dropdownInput.readOnly = true;

    const dropdownList = createList(dropdown, 5);
    dropdownList.ul.classList.add('options', 'list-reset');

    dropdownList.itemArr.forEach((item, index) => {
      item.classList.add('option');
      typeContact.forEach((type, num) => {
        if (index === num) item.textContent = type;
      });
    });

    dropdown.append(dropdownInput, dropdownList.ul);

    const toggleDropdown = (event) => {
      event.stopPropagation();
      dropdown.classList.toggle('opened');
    };

    const selectOption = (event) => {
      dropdownInput.value = event.currentTarget.textContent;
      dropdownInput.ariaLabel = `Выбран тип контакта ${event.currentTarget.textContent}`;
    };

    const closeDropdownFromOutside = () => {
      if (dropdown.classList.contains('opened')) {
        dropdown.classList.remove('opened');
      }
    };

    document.body.addEventListener('click', (e) => {
      closeDropdownFromOutside()
    });

    dropdownList.itemArr.forEach((item) => item.addEventListener('click', selectOption));

    dropdown.addEventListener('click', toggleDropdown);

    return {
      dropdown,
      dropdownInput,
      dropdownList,
    }
  }

  function createList(element, num) {
    const ul = document.createElement('ul');
    ul.classList.add('flex', 'list-reset');
    element.append(ul);

    const itemArr = [];

    for (let i = 1; i <= num; ++i) {
      const li = document.createElement('li');
      ul.append(li);
      itemArr.push(li);
    }

    return {
      ul,
      itemArr,
    }
  }

  function createDialogActionBtn(btnText1, btnText2) {
    const btnSubmit = document.createElement('button');
    const btnLose = document.createElement('button');
    const loader = createLoaderBtn();

    btnSubmit.classList.add('btn', 'modal__btn-save');
    btnLose.classList.add('btn', 'modal__btn-cancel');

    btnSubmit.id = 'btnSubmit'
    btnSubmit.type = 'submit';
    btnLose.type = 'button';
    btnSubmit.setAttribute('form', 'formForClient');
    btnLose.setAttribute('form', 'formForClient');
    btnSubmit.textContent = btnText1;
    btnLose.textContent = btnText2;

    btnSubmit.prepend(loader);

    return {
      btnSubmit,
      btnLose,
      loader,
    }
  }

  function setAttForInput(inputForSetting, benchmark) {
    switch (benchmark) {
      case 'Телефон':
        inputForSetting.type = 'tel';
        inputForSetting.ariaLabel = 'Телефон клиента';
        break;
      case 'Email':
        inputForSetting.type = 'email';
        inputForSetting.ariaLabel = 'Электронная почта клиента';
        break;
      case 'VK':
        inputForSetting.type = 'url';
        inputForSetting.ariaLabel = 'Клиент в социальной сети Вконтакте';
        break;
      case 'Vk':
        inputForSetting.type = 'url';
        inputForSetting.ariaLabel = 'Клиент в социальной сети Вконтакте';
        break;
      case 'Facebook':
        inputForSetting.type = 'url';
        inputForSetting.ariaLabel = 'Клиент в социальной сети Facebook';
        break;
      default:
        inputForSetting.type = 'text';
        inputForSetting.ariaLabel = 'Дополнительный контакт клиента';
        break;
    }
  }

  function getContactsOfForm() {
    contactsArr = Array.from(document.querySelectorAll('.modal-contact__input'));

    let arr = contactsArr.map(item => ({
      type: convertAria(item),
      value: item.value,
    }));

    contactsArr.length = '';

    return arr;
  }

  function convertAria(input) {
    switch (input.ariaLabel) {
      case 'Телефон клиента':
        return type = 'Телефон';
      case 'Электронная почта клиента':
        return type = 'Email';
      case 'Клиент в социальной сети Вконтакте':
        return type = 'Vk';
      case 'Клиент в социальной сети Facebook':
        return type = 'Facebook';
      default:
        return type = 'Other';
    }
  }

  function getValueOfForm(inputName, inputSurname, inputlastName) {
    let objContactsArr = getContactsOfForm();

    return body = {
      name: getValidValue(inputName),
      surname: getValidValue(inputSurname),
      lastName: getValidValue(inputlastName),
      contacts: objContactsArr.slice(),
    }
  }

  function onSuccess(dialog, id, obj) {
    const replaceClient = document.getElementById(id);
    replaceClient.replaceWith(renderClientItem(obj));
    closeModal(dialog);
  }

  function onError(error, errorBox, arr) {
    if (!error) return;

    errorBox.innerHTML = '';

    error.forEach(message => {
      const errorDescr = document.createElement('span');
      errorDescr.textContent = `Ошибка: ${message}`;
      errorBox.prepend(errorDescr);

      if (message.includes('имя')) {
        const input = arr.find(input => input.id === 'name');
        paramInputInvalid(input);
      }

      if (message.includes('фамилия')) {
        const input = arr.find(input => input.id === 'surname');
        paramInputInvalid(input);
      }

      if (message.includes('контакты')) {
        const contactsArr = Array.from(document.querySelectorAll('.modal-contact__input'));

        contactsArr.forEach(contact => {
          if (contact.value === '') {
            const btnDel = createBtnDelContact();
            const contatWrapper = (contact.parentElement).parentElement;

            contact.ariaInvalid = 'true';
            contact.classList.add('modal-contact__invalid');
            contatWrapper.append(btnDel);

            setDisabledForBtn(document.getElementById('btnSubmit'));

            btnDel.addEventListener('click', () => {
              contatWrapper.remove();
              document.querySelector('button[type="submit"]').focus();
            });

            contact.addEventListener('input', () => (btnDel.remove()));
          };
        });
      }
    });
  }

  function checkExcessError() {
    const errorRequaried = 'Ошибка: Не все добавленные контакты полностью заполнены';
    const contactsArr = Array.from(document.querySelectorAll('.modal-contact__input'));

    if (!contactsArr.some(contact => contact.value === '') || contactsArr.length === 0) removeExcessError([errorRequaried]);
  }

  function checkRequired(input) {
    (input.value.trim() === '') ? paramInputInvalid(input) : paramInputValid(input);
  }

  function closeOnBackDropClick({ currentTarget, target }) {
    const dialogElement = currentTarget;
    const isClickedOnBackDrop = target === dialogElement;
    if (isClickedOnBackDrop) closeModal(dialogElement);
  }

  function createClientLink(a) {
    const linkBox = document.createElement('div');
    const span = document.createElement('span');
    const tooltip = document.createElement('span');
    const link = document.createElement('a');

    linkBox.classList.add('flex', 'modal__client-link');
    tooltip.classList.add('modal__client-link-tool');
    link.classList.add('client-link');

    span.textContent = 'ссылка на клиента:';
    tooltip.textContent = 'клик по ссылке для её копирования';
    link.textContent = a;

    linkBox.append(span, tooltip, link);

    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(link.textContent)
        .then(() => {
          tooltip.textContent = 'скопировано';
          setTimeout(() => tooltip.textContent = 'клик по ссылке для её копирования', 5000);
        })
        .catch(error => {
          tooltip.textContent = `текст не скопирован ${error}`;
        });
    })

    return linkBox;
  }

  async function loadClientLink() {
    let currentUrl = window.location.href;

    const clientsArr = await getData(url);
    clientsArr.forEach(client => {
      if (currentUrl.includes(client.id)) {
        const dialog = createModalChange(client);
        openModal(dialog.dialogEl);
      }
    });
  }

  function createModalChange(clientOfChange) {
    let clientUrl = window.location.href;

    clientUrl.includes(clientOfChange.id) ?
      clientUrl = window.location.href : clientUrl = `${window.location.href}#${clientOfChange.id}`;

    const dialogEl = document.createElement('dialog');
    dialogEl.id = clientOfChange.id;
    dialogEl.classList.add('flex', 'modal');
    dialogEl.ariaLabel = 'Окно для внесения изменений в данные клиента';

    const formModal = createDialogForm();
    const modalTitle = createDialogTitle('Изменить данные', clientOfChange);
    const link = createClientLink(clientUrl);
    const closeBtn = createDialogCloseBtn();
    const element = createDialogInput(clientOfChange);
    const newContactBtn = createDialogNewContactBtn();
    const btnSave = createDialogActionBtn('Сохранить', 'Удалить клиента').btnSubmit;
    const buttonDel = createDialogActionBtn('Сохранить', 'Удалить клиента').btnLose;
    const errorBox = formModal.errorWrapper;

    const boxNewContacts = document.createElement('div');
    boxNewContacts.classList.add('flex', 'modal__form');
    boxNewContacts.id = 'boxNewContacts';

    formModal.headerWrapper.append(modalTitle.h3, modalTitle.id, link);
    formModal.inputWrapper.append(element.box);
    formModal.contactWrapper.append(boxNewContacts, newContactBtn);
    formModal.btnWrapper.append(btnSave, buttonDel);
    dialogEl.append(formModal.form, closeBtn);

    const changeContactsArr = clientOfChange.contacts.map(a => ({ ...a }));

    if (changeContactsArr.length > 0) {
      boxNewContacts.classList.add('modal-contact__form');
      formModal.contactWrapper.classList.add('padding--modal-contact');

      changeContactsArr.forEach(itemContact => {
        const contentForBox = createContentForBoxContacts();

        contentForBox.wrapper.append(contentForBox.btnDel);
        boxNewContacts.append(contentForBox.wrapper);

        contentForBox.input.value = itemContact.value;

        setAttForInput(contentForBox.input, itemContact.type);

        switch (itemContact.type) {
          case 'Телефон':
            contentForBox.dropdown.dropdownInput.value = 'Телефон';
            break;
          case 'Email':
            contentForBox.dropdown.dropdownInput.value = 'Email';
            break;
          case 'Vk':
            contentForBox.dropdown.dropdownInput.value = 'VK';
            break;
          case 'Facebook':
            contentForBox.dropdown.dropdownInput.value = 'Facebook';
            break;
          default:
            contentForBox.dropdown.dropdownInput.value = 'Другое';
            break;
        }

        contentForBox.input.addEventListener('input', () => itemContact.value = contentForBox.input.value);

        contentForBox.dropdown.dropdownList.itemArr.forEach((item) => {
          item.addEventListener('click', () => {
            if (contentForBox.input.value) itemContact.type = item.textContent;
          });
        });

        contentForBox.btnDel.addEventListener('click', (e) => {
          boxNewContacts.childNodes.forEach((item, index, arr) => {
            if (item.contains(e.target)) {
              item.remove();
              changeContactsArr.splice(index, 1);
              if (arr.length === 0) {
                boxNewContacts.classList.remove('modal-contact__form');
                formModal.contactWrapper.classList.remove('padding--modal-contact');
              }
            }
          });
          if (changeContactsArr.length < 10) newContactBtn.classList.remove('visually-hidden');
        });
      });
    }

    if (changeContactsArr.length === 10) newContactBtn.classList.add('visually-hidden');

    newContactBtn.addEventListener('click', () => eventNewContactBtn(boxNewContacts, newContactBtn, formModal.contactWrapper));

    boxNewContacts.addEventListener('click', () => {
      checkExcessError();
      setDisabledForBtn(btnSave);
    });


    formModal.form.addEventListener('input', (e) => {
      e.target.value = e.target.value.trim();

      setDisabledForBtn(btnSave)
    });

    formModal.form.addEventListener('submit', async (e) => {
      e.preventDefault();

      errorBox.childNodes.length = 0;

      let objContactsArr = getContactsOfForm();

      clientOfChange.name = getValidValue(element.name.input);
      clientOfChange.surname = getValidValue(element.surname.input);
      clientOfChange.lastName = getValidValue(element.lastName.input);
      clientOfChange.contacts = objContactsArr.slice();

      toggleLoader();

      const sendClient = await replaceClientOnServer(clientOfChange);

      if (!Array.isArray(sendClient)) {
        onSuccess(dialogEl, clientOfChange.id, sendClient);
      } else {
        toggleLoader();
        onError(sendClient, errorBox, [element.surname.input, element.name.input]);
      }
    });


    buttonDel.addEventListener('click', async () => {
      await deleteClient(clientOfChange);
      closeModal(dialogEl);
    });

    dialogEl.addEventListener("click", closeOnBackDropClick);

    dialogEl.addEventListener('keydown', (e) => closeAfterEsc(e, dialogEl));

    closeBtn.addEventListener('click', () => closeModal(dialogEl));

    return {
      dialogEl,
      formModal,
      modalTitle,
      closeBtn,
      element,
      newContactBtn,
      btnSave,
      buttonDel,
      boxNewContacts,
    }
  }

  function createModalNew() {
    const dialogNewClient = document.createElement('dialog');
    dialogNewClient.id = 'dialogNewClient';
    dialogNewClient.classList.add('flex', 'modal');
    dialogNewClient.ariaLabel = 'Окно для создания нового клиента';

    const formModal = createDialogForm();
    const modalTitle = createDialogTitle('Новый клиент', null);
    const closeBtn = createDialogCloseBtn();
    const element = createDialogInput(null);
    const newContactBtn = createDialogNewContactBtn();
    const btnSave = createDialogActionBtn('Сохранить', 'Отмена').btnSubmit;
    const buttonCancel = createDialogActionBtn('Сохранить', 'Отмена').btnLose;
    const errorBox = formModal.errorWrapper;

    const boxNewContacts = document.createElement('div');
    boxNewContacts.classList.add('flex', 'modal__form');
    boxNewContacts.id = 'boxNewContacts';

    formModal.headerWrapper.append(modalTitle.h3);
    formModal.inputWrapper.append(element.box);
    formModal.contactWrapper.append(boxNewContacts, newContactBtn);
    formModal.btnWrapper.append(btnSave, buttonCancel);
    dialogNewClient.append(formModal.form, closeBtn);

    newContactBtn.addEventListener('click', () => eventNewContactBtn(boxNewContacts, newContactBtn, formModal.contactWrapper));

    boxNewContacts.addEventListener('click', () => {
      checkExcessError();
      setDisabledForBtn(btnSave);
    });

    formModal.form.addEventListener('input', (e) => {
      e.target.value = e.target.value.trim();

      setDisabledForBtn(btnSave);
    });

    formModal.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorBox.childNodes.length = 0;
      toggleLoader();

      const tableBody = document.getElementById('tableBody');
      const data = getValueOfForm(element.name.input, element.surname.input, element.lastName.input);

      const sendClient = await sendData(data);

      if (!Array.isArray(sendClient)) {
        tableBody.append(renderClientItem(sendClient));
        closeModal(dialogNewClient);
      } else {
        toggleLoader();
        onError(sendClient, errorBox, [element.surname.input, element.name.input]);
      }
    });

    dialogNewClient.addEventListener("click", closeOnBackDropClick);

    closeBtn.addEventListener('click', () => closeModal(dialogNewClient));

    buttonCancel.addEventListener('click', () => closeModal(dialogNewClient));

    dialogNewClient.addEventListener('keydown', (e) => closeAfterEsc(e, dialogNewClient));

    return {
      dialogNewClient,
      formModal,
    }
  }

  function createModalDelete(clientOfDel) {
    const dialogEl = document.createElement('dialog');
    const deleteBox = document.createElement('div');
    const btnActionWrapper = document.createElement('div');
    const delDescr = document.createElement('span');

    dialogEl.id = 'dialogEl';
    dialogEl.ariaLabel = 'Окно для удаления клиента';

    dialogEl.classList.add('flex', 'modal', 'justify-center');
    deleteBox.classList.add('flex', 'delete-box');
    btnActionWrapper.classList.add('flex', 'modal__action-btn');
    delDescr.classList.add('delete-box__descr');

    const closeBtn = createDialogCloseBtn();
    const modalTitle = createDialogTitle('Удалить клиента', null);
    const btnDel = createDialogActionBtn('Удалить', 'Отмена').btnSubmit;
    const buttonCancel = createDialogActionBtn('Удалить', 'Отмена').btnLose;
    btnDel.type = 'button';

    const question = 'Вы действительно хотите удалить клиента -';

    !!clientOfDel.lastName ?
      (delDescr.textContent = `${question} ${setFirstUpperCase(clientOfDel.surname)} ${setFirstUpperCase(clientOfDel.name)} ${setFirstUpperCase(clientOfDel.lastName)}?`) :
      (delDescr.textContent = `${question} ${setFirstUpperCase(clientOfDel.surname)} ${setFirstUpperCase(clientOfDel.name)}?`);

    btnActionWrapper.append(btnDel, buttonCancel);
    deleteBox.append(modalTitle.h3, delDescr, btnActionWrapper);
    dialogEl.append(closeBtn, deleteBox);

    btnDel.addEventListener('click', async () => {
      toggleLoader();
      await deleteClient(clientOfDel);
      closeModal(dialogEl);
    });

    dialogEl.addEventListener('keydown', async (e) => {
      if (e.code === 'Enter') btnDel.focus();
      closeAfterEsc(e, dialogEl);
    });

    dialogEl.addEventListener("click", closeOnBackDropClick);

    closeBtn.addEventListener('click', () => closeModal(dialogEl));

    buttonCancel.addEventListener('click', () => closeModal(dialogEl));

    return {
      dialogEl,
      buttonCancel,
    }
  }

  function createModalError500(erMessage) {
    const dialogEl = document.createElement('dialog');
    const errorText = document.createElement('span');
    const reloadBtn = document.createElement('button');

    dialogEl.id = 'dialogEl';

    dialogEl.classList.add('flex', 'modal', 'modal__error', 'justify-center');
    errorText.classList.add('flex', 'notfound');
    reloadBtn.classList.add('btn', 'modal__btn-save');
    errorText.textContent = erMessage;
    reloadBtn.textContent = 'Перезагрузить страницу';

    dialogEl.append(errorText, reloadBtn);

    reloadBtn.addEventListener('click', () => location.reload(true));

    return dialogEl;
  }

  function createModalError(erMessage) {
    const dialogEl = document.createElement('dialog');
    const dialogBox = document.createElement('span');

    dialogEl.id = 'dialogEl';

    dialogEl.classList.add('flex', 'modal', 'justify-center');
    dialogBox.classList.add('flex', 'notfound');
    dialogBox.textContent = erMessage;

    const closeBtn = createDialogCloseBtn();

    dialogEl.append(closeBtn, dialogBox);

    dialogEl.addEventListener("click", (e) => {
      const currentTarget = e.currentTarget;
      const target = e.target;
      const obj = { currentTarget, target };
      closeOnBackDropClick(obj);
      deleteNotFoundClient();
    });

    closeBtn.addEventListener('click', () => {
      closeModal(dialogEl);
      deleteNotFoundClient();
    });

    function deleteNotFoundClient() {
      const loaderElement = document.getElementById('loader');
      const delElement = loaderElement.closest(".table__body-row");
      delElement.remove();
    }

    return dialogEl;
  }

  function setError(inputElements, errorText) {
    if (inputElements.some(input => input.ariaInvalid === 'true')) {
      if (errorBox.innerHTML.includes(errorText)) return;

      const errorDescr = document.createElement('span');
      errorBox.prepend(errorDescr);
      errorDescr.textContent = errorText;

    } else {
      const errorArr = Array.from(errorBox.children);
      errorArr.forEach(er => {
        if (er.innerHTML.includes(errorText)) er.remove();
      });
    }
  }

  function paramInputValid(input) {
    input.ariaInvalid = 'false';
    input.classList.remove('input--invalid');
  }

  function paramInputInvalid(input) {
    input.ariaInvalid = 'true';
    input.classList.add('input--invalid');
  }

  function removeExcessError(errorTextArr) {
    const errorBox = document.getElementById('errorBox');
    Array.from(errorBox.children).forEach(er => {
      errorTextArr.forEach(erTxt => {
        if (er.innerHTML.includes(erTxt)) er.remove();
      });
    });
  }

  function setDisabledForBtn(btnSave) {
    const formInputArr = Array.from(document.querySelectorAll(`input[form*="formForClient"]`));

    if (formInputArr.some(input => input.ariaInvalid === 'true')) {
      btnSave.disabled = true;
      btnSave.classList.add('modal__btn-disabled');
    } else {
      btnSave.disabled = false;
      btnSave.classList.remove('modal__btn-disabled');
    }
  }

  function getValidValue(inputName) {
    if (!inputName.value || inputName.ariaInvalid === 'true') return inputName.value;

    return inputName.value.toLowerCase()
      .split(' ')
      .filter(item => item.trim())
      .join('');
  }

  function convertDate(dateObj) {
    let year = dateObj.getFullYear();
    let month = dateObj.getMonth() + 1;
    let date = dateObj.getDate();
    let minutes = dateObj.getMinutes();

    month = month < 10 ? '0' + month : month;
    date = date < 10 ? '0' + date : date;
    minutes = minutes < 10 ? '0' + minutes : minutes;

    let fullDate = `${date}.${month}.${year}`;
    let fullTime = `${dateObj.getHours()}:${minutes}`;

    return {
      fullDate,
      fullTime
    }
  }

  function createDateCell(clientObj, clientCreatedAt, clientUpdatedAt) {
    const listCreateDate = createList(clientCreatedAt, 2);
    const listUpdateDate = createList(clientUpdatedAt, 2);
    listCreateDate.ul.classList.add('cell-date');
    listUpdateDate.ul.classList.add('cell-date');

    const createdObj = new Date(clientObj.createdAt);
    const updatedObj = new Date(clientObj.updatedAt);

    setStyleAndContent(listCreateDate, createdObj);
    setStyleAndContent(listUpdateDate, updatedObj);

    function setStyleAndContent(arr, obj) {
      arr.itemArr.forEach((item, index) => {
        if (index !== 0) item.classList.add('table__time');
        item.textContent = index === 0 ? convertDate(obj).fullDate : convertDate(obj).fullTime;
      });
    }
  }

  function createContactCell(clientContact, contactsCount, arr) {
    const list = createList(clientContact, contactsCount);
    list.ul.classList.add('contacts-list');

    list.itemArr.forEach((element, indexEl) => {
      element.classList.add('relative');
      arr.forEach((item, indexItem) => {
        if (indexEl === indexItem) element.append(setContactLink(item));
      });
    });

    function setContactLink(item) {
      switch (item.type) {
        case 'Телефон':
          return link = createLinkContact(item, createSvgPhone());
        case 'Email':
          return link = createLinkContact(item, createSvgMail());
        case 'Vk':
          return link = createLinkContact(item, createSvgVk());
        case 'Facebook':
          return link = createLinkContact(item, createSvgFb());
        default:
          return link = createLinkContact(item, createSvgOther());
      }
    }

    function createLinkContact(obj, funk) {
      const a = document.createElement('a');
      a.classList.add('contacts-list__link');

      switch (obj.type) {
        case 'Телефон':
          a.href = `tel:${getValidValue(obj)}`;
          break;
        case 'Email':
          a.href = `mailto:${obj.value}`;
          break;
        default:
          a.href = obj.value;
          break;
      }

      const contactTooltip = ctreateTooltip(obj.type, obj.value);

      a.append(funk, contactTooltip);

      return a;
    }
  };

  function getId(e) {
    let id;

    tableBody.childNodes.forEach(async element => {
      if (element.contains(e.target)) id = element.id;
    });

    return id;
  }

  function createActionCell(clientAction) {
    const actionList = createList(clientAction, 2);
    const changeBtn = document.createElement('button');
    const deleteBtn = document.createElement('button');
    const svgChange = createSvgChangeBtn();
    const svgDel = createSvgDeleteBtn();
    const changeSpan = document.createElement('span');
    const deleteSpan = document.createElement('span');

    actionList.ul.classList.add('action-list');
    changeBtn.classList.add('flex', 'btn', 'action-list__changebtn', 'align-center');
    deleteBtn.classList.add('flex', 'btn', 'action-list__deletebtn', 'align-center');

    changeSpan.textContent = 'Изменить';
    deleteSpan.textContent = 'Удалить';

    changeBtn.append(svgChange, changeSpan);
    deleteBtn.append(svgDel, deleteSpan);

    actionList.itemArr.forEach((item, index) => {
      item.classList.add('action-list__item');
      index === 0 ? item.append(changeBtn) : item.append(deleteBtn);
    });

    changeBtn.addEventListener('click', async (e) => await clickActionBtn(svgChange, changeBtn, e, createModalChange));

    deleteBtn.addEventListener('click', async (e) => await clickActionBtn(svgDel, deleteBtn, e, createModalDelete));

    async function clickActionBtn(svgName, nameBtn, e, fn) {
      const id = getId(e);
      const loader = activeLoaderBtn(svgName, nameBtn);
      const currentClient = await getData(`${url}/${id}`);
      const createModal = fn;
      const dialog = createModal(currentClient);
      openModal(dialog.dialogEl);

      loader.replaceWith(svgName);
    }

    return {
      changeBtn,
      deleteBtn,
    }
  }

  function renderClientItem(clientObj) {
    const client = document.createElement('tr');
    const clientId = document.createElement('td');
    const clientName = document.createElement('td');
    const clientCreatedAt = document.createElement('td');
    const clientUpdatedAt = document.createElement('td');
    const clientContact = document.createElement('td');
    const clientAction = document.createElement('td');

    client.id = clientObj.id;

    client.classList.add('table__body-row', 'table__text');
    clientId.classList.add('id-cell', 'text-grey');

    clientId.textContent = clientObj.id;

    if (clientObj.lastName) {
      clientName.textContent = `${setFirstUpperCase(clientObj.surname)} ${setFirstUpperCase(clientObj.name)} ${setFirstUpperCase(clientObj.lastName)}`;
    } else {
      clientName.textContent = `${setFirstUpperCase(clientObj.surname)} ${setFirstUpperCase(clientObj.name)}`;
    }

    createDateCell(clientObj, clientCreatedAt, clientUpdatedAt);
    createContactCell(clientContact, clientObj.contacts.length, clientObj.contacts);
    createActionCell(clientAction);
    client.append(clientId, clientName, clientCreatedAt, clientUpdatedAt, clientContact, clientAction);

    client.childNodes.forEach((item, index) => {
      item.classList.add('table__cell');
      if (clientObj.contacts.length <= 5) item.classList.add('table__cell--pad');
      if (index === 4) item.classList.add('cell-contacts');
      if (index === 5) item.classList.add('cell-action');
    });

    return client;
  }

  function createInput(inputId, inputType, textContent) {
    const div = document.createElement('div');
    const input = document.createElement('input');
    const label = document.createElement('label');

    div.append(input, label);

    input.setAttribute('form', 'formForClient');
    input.placeholder = ' ';
    input.type = inputType;
    input.id = inputId;
    input.name = inputId;
    input.ariaInvalid = 'false';
    label.for = inputId;
    label.textContent = textContent;

    div.classList.add('input-wrapper');
    input.classList.add('modal__input');

    (textContent === 'Фамилия' || textContent === 'Имя') ?
      label.classList.add('modal__label', 'modal__label-required') : label.classList.add('modal__label');

    input.addEventListener('input', () => {
      (input.value !== '') ? label.classList.add('modal__label-after') : label.classList.remove('modal__label-after');
    });

    return {
      div,
      input,
      label,
    }
  }

  function createSvg(width, height, viewBox) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    const svgAtt = {
      width: width,
      height: height,
      viewBox: viewBox,
    }

    svg.setAttribute(Object.keys(svgAtt)[0], svgAtt.width);
    svg.setAttribute(Object.keys(svgAtt)[1], svgAtt.height);
    svg.setAttribute(Object.keys(svgAtt)[2], svgAtt.viewBox);
    svg.setAttribute('fill', 'none');

    svg.append(path);

    return {
      svg,
      path,
    }
  }

  function createSvgArrow() {
    const arrow = createSvg('8px', '8px', '0 0 8 8');
    arrow.path.setAttribute('d', 'M8 4L7.295 3.295L4.5 6.085L4.5 0L3.5 0L3.5 6.085L0.71 3.29L0 4L4 8L8 4Z');
    arrow.svg.classList.add('table__header-svg', 'arrow');

    return arrow.svg;
  }

  function createSvgLetter() {
    const letter = createSvg('16px', '16px', '0 0 16 8');
    letter.path.setAttribute('d', 'M5.37109 8L4.6582 6.01758H1.92871L1.23047 8H0L2.6709 0.832031H3.94043L6.61133 8H5.37109ZM4.35059 5.01172L3.68164 3.06836C3.63281 2.93815 3.56445 2.73307 3.47656 2.45312C3.39193 2.17318 3.33333 1.9681 3.30078 1.83789C3.21289 2.23828 3.08431 2.67611 2.91504 3.15137L2.27051 5.01172H4.35059ZM6.96289 5.80762V4.83105H9.47266V5.80762H6.96289ZM13.0322 5.13867L11.2646 8H9.93164L11.9434 4.87012C11.0319 4.55436 10.5762 3.8903 10.5762 2.87793C10.5762 2.22363 10.8024 1.72396 11.2549 1.37891C11.7074 1.03385 12.373 0.861328 13.252 0.861328H15.3955V8H14.2236V5.13867H13.0322ZM14.2236 1.83789H13.2959C12.8044 1.83789 12.4268 1.92578 12.1631 2.10156C11.9027 2.27409 11.7725 2.55729 11.7725 2.95117C11.7725 3.33529 11.8994 3.63477 12.1533 3.84961C12.4072 4.06445 12.8011 4.17188 13.335 4.17188H14.2236V1.83789Z');
    letter.svg.classList.add('table__header-svg');

    return letter.svg;
  }

  function createSvgNewClientBtn() {
    const btnSvg = createSvg('23px', '16px', '0 0 23 16');
    btnSvg.path.setAttribute('d', 'M14.5 8C16.71 8 18.5 6.21 18.5 4C18.5 1.79 16.71 0 14.5 0C12.29 0 10.5 1.79 10.5 4C10.5 6.21 12.29 8 14.5 8ZM5.5 6V3H3.5V6H0.5V8H3.5V11H5.5V8H8.5V6H5.5ZM14.5 10C11.83 10 6.5 11.34 6.5 14V16H22.5V14C22.5 11.34 17.17 10 14.5 10Z');
    btnSvg.svg.classList.add('btn__svg');

    return btnSvg.svg;
  }

  function createSvgFb() {
    const fb = createSvg('16px', '16px', '0 0 16 16');
    fb.path.setAttribute('d', 'M7.99999 0C3.6 0 0 3.60643 0 8.04819C0 12.0643 2.928 15.3976 6.75199 16V10.3775H4.71999V8.04819H6.75199V6.27309C6.75199 4.25703 7.94399 3.14859 9.77599 3.14859C10.648 3.14859 11.56 3.30121 11.56 3.30121V5.28514H10.552C9.55999 5.28514 9.24799 5.90362 9.24799 6.53815V8.04819H11.472L11.112 10.3775H9.24799V16C11.1331 15.7011 12.8497 14.7354 14.0879 13.2772C15.3261 11.819 16.0043 9.96437 16 8.04819C16 3.60643 12.4 0 7.99999 0Z');
    fb.svg.classList.add('contacts-list__svg');

    return fb.svg;
  }

  function createSvgPhone() {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const phone = createSvg('16px', '16px', '0 0 16 16');
    phone.path.setAttribute('d', 'M11.56 9.50222C11.0133 9.50222 10.4844 9.41333 9.99111 9.25333C9.83556 9.2 9.66222 9.24 9.54222 9.36L8.84444 10.2356C7.58667 9.63556 6.40889 8.50222 5.78222 7.2L6.64889 6.46222C6.76889 6.33778 6.80444 6.16444 6.75556 6.00889C6.59111 5.51556 6.50667 4.98667 6.50667 4.44C6.50667 4.2 6.30667 4 6.06667 4H4.52889C4.28889 4 4 4.10667 4 4.44C4 8.56889 7.43556 12 11.56 12C11.8756 12 12 11.72 12 11.4756V9.94222C12 9.70222 11.8 9.50222 11.56 9.50222Z');
    phone.svg.classList.add('contacts-list__svg');

    circle.setAttribute('cx', '8');
    circle.setAttribute('cy', '8');
    circle.setAttribute('r', '8');
    phone.path.setAttribute('fill', 'white');

    phone.svg.prepend(circle);

    return phone.svg;
  }

  function createSvgMail() {
    const mail = createSvg('16px', '16px', '0 0 16 16');
    mail.path.setAttribute('d', 'M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM4 5.75C4 5.3375 4.36 5 4.8 5H11.2C11.64 5 12 5.3375 12 5.75V10.25C12 10.6625 11.64 11 11.2 11H4.8C4.36 11 4 10.6625 4 10.25V5.75ZM8.424 8.1275L11.04 6.59375C11.14 6.53375 11.2 6.4325 11.2 6.32375C11.2 6.0725 10.908 5.9225 10.68 6.05375L8 7.625L5.32 6.05375C5.092 5.9225 4.8 6.0725 4.8 6.32375C4.8 6.4325 4.86 6.53375 4.96 6.59375L7.576 8.1275C7.836 8.28125 8.164 8.28125 8.424 8.1275Z');
    mail.svg.classList.add('contacts-list__svg');

    return mail.svg;
  }

  function createSvgOther() {
    const other = createSvg('16px', '16px', '0 0 16 16');
    other.path.setAttribute('d', 'M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM3 8C3 5.24 5.24 3 8 3C10.76 3 13 5.24 13 8C13 10.76 10.76 13 8 13C5.24 13 3 10.76 3 8ZM9.5 6C9.5 5.17 8.83 4.5 8 4.5C7.17 4.5 6.5 5.17 6.5 6C6.5 6.83 7.17 7.5 8 7.5C8.83 7.5 9.5 6.83 9.5 6ZM5 9.99C5.645 10.96 6.75 11.6 8 11.6C9.25 11.6 10.355 10.96 11 9.99C10.985 8.995 8.995 8.45 8 8.45C7 8.45 5.015 8.995 5 9.99Z');
    other.svg.classList.add('contacts-list__svg');

    return other.svg;
  }

  function createSvgVk() {
    const vk = createSvg('16px', '16px', '0 0 16 16');
    vk.path.setAttribute('d', 'M8 0C3.58187 0 0 3.58171 0 8C0 12.4183 3.58187 16 8 16C12.4181 16 16 12.4183 16 8C16 3.58171 12.4181 0 8 0ZM12.058 8.86523C12.4309 9.22942 12.8254 9.57217 13.1601 9.97402C13.3084 10.1518 13.4482 10.3356 13.5546 10.5423C13.7065 10.8371 13.5693 11.1604 13.3055 11.1779L11.6665 11.1776C11.2432 11.2126 10.9064 11.0419 10.6224 10.7525C10.3957 10.5219 10.1853 10.2755 9.96698 10.037C9.87777 9.93915 9.78382 9.847 9.67186 9.77449C9.44843 9.62914 9.2543 9.67366 9.1263 9.90707C8.99585 10.1446 8.96606 10.4078 8.95362 10.6721C8.93577 11.0586 8.81923 11.1596 8.43147 11.1777C7.60291 11.2165 6.81674 11.0908 6.08606 10.6731C5.44147 10.3047 4.94257 9.78463 4.50783 9.19587C3.66126 8.04812 3.01291 6.78842 2.43036 5.49254C2.29925 5.2007 2.39517 5.04454 2.71714 5.03849C3.25205 5.02817 3.78697 5.02948 4.32188 5.03799C4.53958 5.04143 4.68362 5.166 4.76726 5.37142C5.05633 6.08262 5.4107 6.75928 5.85477 7.38684C5.97311 7.55396 6.09391 7.72059 6.26594 7.83861C6.45582 7.9689 6.60051 7.92585 6.69005 7.71388C6.74734 7.57917 6.77205 7.43513 6.78449 7.29076C6.82705 6.79628 6.83212 6.30195 6.75847 5.80943C6.71263 5.50122 6.53929 5.30218 6.23206 5.24391C6.07558 5.21428 6.0985 5.15634 6.17461 5.06697C6.3067 4.91245 6.43045 4.81686 6.67777 4.81686L8.52951 4.81653C8.82136 4.87382 8.88683 5.00477 8.92645 5.29874L8.92808 7.35656C8.92464 7.47032 8.98521 7.80751 9.18948 7.88198C9.35317 7.936 9.4612 7.80473 9.55908 7.70112C10.0032 7.22987 10.3195 6.67368 10.6029 6.09801C10.7279 5.84413 10.8358 5.58142 10.9406 5.31822C11.0185 5.1236 11.1396 5.02785 11.3593 5.03112L13.1424 5.03325C13.195 5.03325 13.2483 5.03374 13.3004 5.04274C13.6009 5.09414 13.6832 5.22345 13.5903 5.5166C13.4439 5.97721 13.1596 6.36088 12.8817 6.74553C12.5838 7.15736 12.2661 7.55478 11.9711 7.96841C11.7001 8.34652 11.7215 8.53688 12.058 8.86523Z');
    vk.svg.classList.add('contacts-list__svg');

    return vk.svg;
  }

  function createNewContactSvg() {
    const newContact = createSvg('14px', '14px', '0 0 14 14');
    newContact.path.setAttribute('d', 'M7.00001 3.66659C6.63334 3.66659 6.33334 3.96659 6.33334 4.33325V6.33325H4.33334C3.96668 6.33325 3.66668 6.63325 3.66668 6.99992C3.66668 7.36659 3.96668 7.66659 4.33334 7.66659H6.33334V9.66659C6.33334 10.0333 6.63334 10.3333 7.00001 10.3333C7.36668 10.3333 7.66668 10.0333 7.66668 9.66659V7.66659H9.66668C10.0333 7.66659 10.3333 7.36659 10.3333 6.99992C10.3333 6.63325 10.0333 6.33325 9.66668 6.33325H7.66668V4.33325C7.66668 3.96659 7.36668 3.66659 7.00001 3.66659ZM7.00001 0.333252C3.32001 0.333252 0.333344 3.31992 0.333344 6.99992C0.333344 10.6799 3.32001 13.6666 7.00001 13.6666C10.68 13.6666 13.6667 10.6799 13.6667 6.99992C13.6667 3.31992 10.68 0.333252 7.00001 0.333252ZM7.00001 12.3333C4.06001 12.3333 1.66668 9.93992 1.66668 6.99992C1.66668 4.05992 4.06001 1.66659 7.00001 1.66659C9.94001 1.66659 12.3333 4.05992 12.3333 6.99992C12.3333 9.93992 9.94001 12.3333 7.00001 12.3333Z');
    newContact.svg.classList.add('svg--color');

    return newContact.svg;
  }

  function createNewContactSvgHover() {
    const newContactHover = createSvg('14px', '14px', '0 0 14 14');
    newContactHover.path.setAttribute('d', 'M0.333313 7.00016C0.333313 3.32016 3.31998 0.333496 6.99998 0.333496C10.68 0.333496 13.6666 3.32016 13.6666 7.00016C13.6666 10.6802 10.68 13.6668 6.99998 13.6668C3.31998 13.6668 0.333313 10.6802 0.333313 7.00016ZM6.33329 4.33366C6.33329 3.96699 6.63329 3.66699 6.99996 3.66699C7.36663 3.66699 7.66663 3.96699 7.66663 4.33366V6.33366H9.66663C10.0333 6.33366 10.3333 6.63366 10.3333 7.00033C10.3333 7.36699 10.0333 7.66699 9.66663 7.66699H7.66663V9.66699C7.66663 10.0337 7.36663 10.3337 6.99996 10.3337C6.63329 10.3337 6.33329 10.0337 6.33329 9.66699V7.66699H4.33329C3.96663 7.66699 3.66663 7.36699 3.66663 7.00033C3.66663 6.63366 3.96663 6.33366 4.33329 6.33366H6.33329V4.33366Z');
    newContactHover.svg.classList.add('svg--color');

    newContactHover.path.setAttribute('fill-rule', 'evenodd');
    newContactHover.path.setAttribute('clip-rule', 'evenodd');

    return newContactHover.svg;
  }

  function createSvgChangeBtn() {
    const changeBtnS = createSvg('12px', '12px', '0 0 12 12');
    changeBtnS.path.setAttribute('d', 'M0 9.49996V12H2.5L9.87333 4.62662L7.37333 2.12662L0 9.49996ZM11.8067 2.69329C12.0667 2.43329 12.0667 2.01329 11.8067 1.75329L10.2467 0.193291C9.98667 -0.066709 9.56667 -0.066709 9.30667 0.193291L8.08667 1.41329L10.5867 3.91329L11.8067 2.69329Z');
    changeBtnS.svg.classList.add('action-list__changesvg');

    return changeBtnS.svg;
  }

  function createSvgDeleteBtn() {
    const deleteBtnS = createSvg('12px', '12px', '0 0 12 12');
    deleteBtnS.path.setAttribute('d', 'M6 0C2.682 0 0 2.682 0 6C0 9.318 2.682 12 6 12C9.318 12 12 9.318 12 6C12 2.682 9.318 0 6 0ZM6 10.8C3.354 10.8 1.2 8.646 1.2 6C1.2 3.354 3.354 1.2 6 1.2C8.646 1.2 10.8 3.354 10.8 6C10.8 8.646 8.646 10.8 6 10.8ZM8.154 3L6 5.154L3.846 3L3 3.846L5.154 6L3 8.154L3.846 9L6 6.846L8.154 9L9 8.154L6.846 6L9 3.846L8.154 3Z');
    deleteBtnS.svg.classList.add('action-list__deletesvg');

    return deleteBtnS.svg;
  }

  function setFirstUpperCase(string) {
    if (string === '') return '';
    let str = string.toLowerCase();
    return str[0].toUpperCase() + str.slice(1);
  }

  function sort(a, b) {
    return a.id - b.id;
  }

  function sortFullName(a, b) {
    if (a.surname !== b.surname) {
      return a.surname.localeCompare(b.surname);
    } else {
      if (a.name !== b.name) {
        return a.name.localeCompare(b.name);
      } else {
        return a.lastName.localeCompare(b.lastName);
      }
    }
  }

  function sortCreateDate(a, b) {
    let dateA = new Date(a.createdAt);
    let dateB = new Date(b.createdAt);

    return dateA - dateB;
  }

  function sortUpDate(a, b) {
    let dateA = new Date(a.updatedAt);
    let dateB = new Date(b.updatedAt);

    return dateA - dateB;
  }

  function startSort(nameCol) {
    const targetCol = document.getElementById(nameCol);
    const arrow = targetCol.querySelector('.arrow');

    const arrowObj = {
      arrow: arrow,
      vector: false,
    }

    targetCol.addEventListener('click', async () => {
      const getArr = await getData(url);

      let clientsArr = getArr.slice();
      let sortArr;

      if (nameCol === 'firstCol') {
        sortArr = clientsArr.toSorted(sort);
      } else if (nameCol === 'secondCol') {
        sortArr = clientsArr.toSorted(sortFullName);
      } else if (nameCol === 'thirdCol') {
        sortArr = clientsArr.toSorted(sortCreateDate);
      } else if (nameCol === 'fourthCol') {
        sortArr = clientsArr.toSorted(sortUpDate);
      }

      while (tableBody.children.length > 0) tableBody.lastChild.remove();

      if (arrowObj.vector) {
        arrow.classList.remove('svg--rotate');
        arrowObj.vector = false;
      } else {
        sortArr.reverse();
        arrow.classList.add('svg--rotate');
        arrowObj.vector = true;
      }

      sortArr.forEach((item) => {
        const sortClient = renderClientItem(item);
        tableBody.append(sortClient);
      });
    });
  }

  function closeModal(dialog) {
    dialog.classList.add('modal__close')
    page.classList.remove('scroll-lock');
    window.scrollTo(0, scrollPosition);
    page.style.top = '';

    setTimeout(() => {
      dialog.close();
      dialog.remove();
    }, 1000);
  }

  function closeAfterEsc(e, dialog) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal(dialog);
    }
  }

  function openModal(dialog) {
    scrollPosition = window.scrollY;
    page.style.top = -scrollPosition + 'px';
    page.classList.add('scroll-lock');
    document.body.append(dialog);
    dialog.showModal();
  }

  async function searchClient() {
    if (searchInput.value === ' ' || searchInput.value === null || !searchInput.value) return;

    const requiredClient = searchInput.value.toLowerCase().split(' ').filter(item => item.trim());

    let answer = [];
    let result = [];

    for (let client of requiredClient) answer = await getData(`${url}?search=${client}`);

    requiredClient.join(' ').split().forEach(client => {
      result = answer.filter(item => {
        return (`${item.surname} ${item.name} ${item.lastName}`).includes(client) ||
          (`${item.surname} ${item.lastName} ${item.name}`).includes(client) ||
          (`${item.name} ${item.surname} ${item.lastName}`).includes(client) ||
          (`${item.name} ${item.lastname} ${item.surname}`).includes(client) ||
          (`${item.lastName} ${item.name} ${item.surname}`).includes(client) ||
          (`${item.lastName} ${item.surname} ${item.name}`).includes(client);
      });
    });

    return result;
  }

  function debounce(func, ms) {
    let timeout;
    return function () {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, arguments), ms);
    };
  }

  async function autoComplete() {
    let result = await searchClient();

    if (result === '' || typeof (result) === "undefined") return;

    searchList.innerHTML = '';

    if (searchInput.value.length >= 2) {
      result.forEach(obj => {
        const li = document.createElement('li');
        li.id = `${obj.id}li`;
        li.textContent = `${obj.surname} ${obj.name} ${obj.lastName}`;
        searchList.append(li);
      })

      if (searchList.children.length > 0) searchList.classList.add('visually-visible');

      searchList.childNodes.forEach((el, index) => {
        el.classList.add('header__search-item');
        if (count === index) {
          el.ariaLabel = `найти в списке клиента ${el.textContent}?`;
          el.classList.toggle("header__search-item-hover");
        }
      });
    } else if (searchInput.value.length < 2) {
      searchList.classList.remove('visually-visible');
    }
  }

  function showFoundClient(e) {
    setSearchInputValue(e);

    const foundClient = document.getElementById(parseInt(e.target.id));

    clearSearchList();
    setClassSearchBtn();

    foundClient.scrollIntoView({ behavior: "smooth", block: "center", inline: "start" });
    foundClient.classList.add('bg-found');

    function setSearchInputValue(e) {
      const newValue = e.target.textContent.toLowerCase()
        .split(' ')
        .map(item => setFirstUpperCase(item))
        .filter(item => item.trim())
        .join(' ');
      searchInput.value = newValue;
    }
  }

  function clearSearchList() {
    searchList.innerHTML = '';
    searchList.classList.remove('visually-visible');
    count = -1;
  }

  function setClassSearchBtn() {
    const lineArr = searchBtn.querySelectorAll('span');

    if (searchInput.value) {
      searchBtn.classList.remove('visually-hidden');
      searchBtn.classList.add('btn', 'header__btn');
      lineArr.forEach(line => line.classList.add('headr__btn-line'));
    } else {
      searchBtn.classList.add('visually-hidden');
      searchBtn.classList.remove('btn', 'header__btn');
      lineArr.forEach(line => line.classList.remove('headr__btn-line'));
    }
  }

  function pressKeyboard(e) {
    const arr = Array.from(searchList.children);
    if (arr.length === 0) return;

    switch (e.code) {
      case "ArrowDown":
        {
          pressArrow(1, arr),
            e.preventDefault();
          break;
        }
      case "ArrowUp":
        {
          pressArrow(-1, arr),
            e.preventDefault();
          break;
        }
      case "Enter":
        {
          const index = count;
          arr[index].click();
          break;
        }
      case "NumpadEnter":
        {
          const index = count;
          arr[index].click();
          break;
        }
    }

    function pressArrow(num, arr) {
      count = count + num;

      if (count >= arr.length) return count = arr.length;
      if (count <= -1) return count = -1;
    }
  }

  function removeBgFound(element) {
    element.childNodes.forEach(el => {
      if (el.childNodes[1].textContent !== searchInput.value) el.classList.remove('bg-found');
    });
  }

  function controlApp() {
    const mainContent = createMainContent();

    const clearSearchListFocusOut = debounce(clearSearchList, 150);

    autoComplete = debounce(autoComplete, 300);

    loadClientLink();

    mainContent.clientNewBtn.btn.addEventListener('click', () => {
      const dialogNew = createModalNew();
      openModal(dialogNew.dialogNewClient);
    });

    headerForm.addEventListener('submit', (e) => e.preventDefault());

    headerForm.addEventListener('input', () => {
      if (!searchInput.value) clearSearchList();
      setClassSearchBtn();
    });

    headerForm.addEventListener('focusout', clearSearchListFocusOut);

    searchInput.addEventListener('focusin', autoComplete);

    headerForm.addEventListener('keydown', (e) => {
      if (e.code === "Tab") return;
      autoComplete();
      pressKeyboard(e);
    });

    searchList.addEventListener('click', (e) => showFoundClient(e));

    headerForm.addEventListener('click', () => removeBgFound(mainContent.clientsBox.tbody));

    searchBtn.addEventListener('click', () => {
      searchInput.value = '';
      removeBgFound(mainContent.clientsBox.tbody);
      clearSearchList();
      setClassSearchBtn();
    });

    startSort('firstCol');
    startSort('secondCol');
    startSort('thirdCol');
    startSort('fourthCol');
  }

  window.controlApp = controlApp;
})();

document.addEventListener('DOMContentLoaded', function () {
  controlApp();
});

