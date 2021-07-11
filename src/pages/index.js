import {Card} from '../components/Card.js';
import {config} from '../utils/constants.js';
import Section from '../components/Section.js';
import PopupWithImage from '../components/PopupWithImage.js';
import PopupWithForm from '../components/PopupWithForm.js';
import FormValidator from '../components/FormValidator.js';
import UserInfo from '../components/UserInfo.js';
import './index.css';
import Api from '../components/Api.js';
import PopupConfirm from '../components/PopupConfirm.js';

/**
 * Event listener handler for card photo
 */
function handleCardClick (popup) {
  return function (photoAttributes, placeNameText) {
           return () => {popup.open(photoAttributes, placeNameText)}
         }
};

/**
 * Adds a place card to the page
 * @param {Object} cardData - {name: "", link: "", ...}
 * @param {Section} destinationSection
 */
function addPlaceCard(cardData, destinationSection, api, userInfo, deleteConfirmPopup) {
  cardData.templateSelector = config.cardTemplateSelector;
  cardData.handleCardClick = handleCardClick(photoPopup);
  cardData.cardDeleteCallback = (cardId, localCardDeleteCallback) => {
    deleteConfirmPopup.setSubmitHandler(() => localCardDeleteCallback(api.deleteCard(cardId)));
    deleteConfirmPopup.open();
  };
  cardData.cardLikeCallback = (cardId, liked) => {
    if (liked)
      return api.unlikeCard(cardId);
    else
      return api.likeCard(cardId);
  };
  cardData.userId = userInfo.getUserInfo().userId;
  const placeCard = new Card(cardData);
  destinationSection.addItem(placeCard.generateCard());
}

/**
 * Adds a new place card to the server and page
 * @param {Object} cardData - {name: "", link: ""}
 * @param {Section} destinationSection
 * @param {Api} api
 */
function addPlaceCardAsync(cardData, destinationSection, api, userInfo, deleteConfirmPopup) {
  api.addCard(cardData)
  .then(apiCardData => addPlaceCard(apiCardData, destinationSection, api, userInfo, deleteConfirmPopup))
  .catch(err => console.log(err));
}

const photoPopup = new PopupWithImage(config.photoPopupTemplateSelector);

/**
 * Creates a form submit handler with a given callback
 * @param {Function} callback - runs inside of the handler
 * @returns {formSubmitHandler}
 */
function makeFormSubmitHandler(callback) {
  /**
   * Creates a form submit handler with the given form data
   * @param {Object} formData - {property1: "value1", property2: "value2"}
   * @returns
   */
  const handler = function formSubmitHandler (formData) {
    return function (evt) {
      evt.preventDefault();
      callback(formData);
      this.close();
    }
  }
  return handler;
}

/**
 * Creates enabled form validator for a given form
 * @param {HTMLElement} form
 * @returns {FormValidator}
 */
function makeEnabledValidator(form) {
  const validator = new FormValidator(config, form);
  validator.enableValidation();
  return validator;
}

//prepare api object for use
const api = new Api({
  baseUrl: 'https://mesto.nomoreparties.co/v1/cohort-25/',
  headers: {
    authorization: 'd8d84bac-32d7-42f9-a622-bbe14f1aa9f5',
    'Content-Type': 'application/json'
  }
});

Promise.all([api.getUserInfo(), api.getInitialCards()])
  .then(([info, cards]) => {

    //set up profile info logic
    info.profileNameSelector = config.profileNameSelector;
    info.profileDescriptionSelector = config.profileDescriptionSelector;
    info.profileAvatarSelector = config.profileAvatarSelector;
    const profileInfo = new UserInfo(info);

    profileInfo.setUserInfo({ name: info.name, description: info.about });

    const profileEditSubmitHandler = makeFormSubmitHandler(
      (formData) => {
        api.setUserInfo({ name: formData[config.profileInputNameName], about: formData[config.profileInputDescriptionName] })
        .then(info => {
          profileInfo.setUserInfo({ name: formData[config.profileInputNameName], description: formData[config.profileInputDescriptionName] });
        })
        .catch(err => console.log(err));
      }
    );

    const profileEditPopup = new PopupWithForm({
      popupSelector: config.profileEditPopupTemplateSelector,
      formSubmitCallback: profileEditSubmitHandler });

    const profileEditPopupValidator = makeEnabledValidator(profileEditPopup.getForm());
    const profileEditButton = document.querySelector('.profile__edit-button');
    profileEditButton.addEventListener('click',
      () => profileEditPopup.open(
        () => {
          profileEditPopupValidator.clearFormValidation();
          profileEditPopup.setInputValues(profileInfo.getUserInfo());
        }
      )
    );

    //prep avatar edit logic
    const avatarEditSubmitHandler = makeFormSubmitHandler(
      (formData) => {
        api.setUserAvatar(formData[config.avatarEditInputName])
        .then(result => {
          profileInfo.setUserAvatar(formData[config.avatarEditInputName]);
        })
        .catch(err => console.log(err));
      }
    );

    const avatarEditPopup = new PopupWithForm({
      popupSelector: config.avatarEditPopupTemplateSelector,
      formSubmitCallback: avatarEditSubmitHandler
    });

    const avatarEditPopupValidator = makeEnabledValidator(avatarEditPopup.getForm());
    const avatarEditButton = document.querySelector(config.profileAvatarEditButtonSelector);
    avatarEditButton.addEventListener('click',
      () => avatarEditPopup.open( () => avatarEditPopupValidator.clearFormValidation() )
    );

    //prepare card delete popup
    const cardDeleteConfirmPopup = new PopupConfirm(config.cardDeleteConfirmPopupTemplateSelector);

    //display initial cards
    const placesList = new Section({
      items: cards.reverse(),
      renderer: (item) => addPlaceCard(item, placesList, api, profileInfo, cardDeleteConfirmPopup)
    }, `.${config.placesList}`);

    placesList.renderItems();

    //set up card addition logic
    const profileAddSubmitHandler = makeFormSubmitHandler(
      (formData) =>
        addPlaceCardAsync({ name: formData[config.placeInputNameName],
                            link: formData[config.placeInputUrlName] },
                            placesList,
                            api,
                            profileInfo,
                            cardDeleteConfirmPopup)
    );

    const profileAddPopup = new PopupWithForm({
      popupSelector: config.profileAddPopupTemplateSelector,
      formSubmitCallback: profileAddSubmitHandler });

    const profileAddPopupValidator = makeEnabledValidator(profileAddPopup.getForm());

    const profileAddButton = document.querySelector(config.profileAddButtonSelector);
    profileAddButton.addEventListener('click',
     () => profileAddPopup.open(
       () => profileAddPopupValidator.clearFormValidation()
      )
    );

  })
  .catch(err => console.log(err));



