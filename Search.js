var inProgress = false;
let itemNumber;
let contentType = 'new';

var SetDropDownContent = (response, isNewSearch) =>
{
    let str = '<table id="DropDownTable">' + CreateTableRowsString(response) + '</table>';
    document.getElementById('DropdownContent').innerHTML = str;
}

(function SetScrollListener()
{
    document.addEventListener('scroll', () => 
    {
        let scrollTop = document.body.scrollTop + 100;
        let offset = document.body.scrollHeight - document.body.clientHeight;
        if(scrollTop > offset && !inProgress)
        {
            inProgress = true;
            if(contentType === 'new')
            {
                let newUrl = url + `&offset=${itemNumber}`;
                SearchByUrl(newUrl, false, RequestForArray);
            }
            else
            {
                AddElements();
            }
        }
    });
    var request = window.indexedDB.open("Favourites", 4);
    request.onerror = (event) => {
        console.log('Error');
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        isConnectedToDB = true;
    };

    request.onupgradeneeded = (event) => {
        var db = event.target.result;
        var objectStore = db.createObjectStore("Favourites", { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex("index", "index", { unique: true });
        objectStore.createIndex("type", "type", { unique: false });
      };
})();

let isConnectedToDB = false;
var db;

function GetTransaction()
{
    return db.transaction(['Favourites'], 'readwrite').objectStore('Favourites');
}

let itemsToAdd;
let itemsAdded;
let itemsArray;

var CallbackForItem = (response, isNewSearch) =>
{
    itemsArray[itemsAdded++] = response;
    if(itemsToAdd == itemsAdded)
    {
        RequestForArray(itemsArray, isNewSearch);
        if(isFirst) isFirst = false;
    }
}

let isFirst;

function RequestForItem(item)
{
    if(item.type === 'gif')
    {
        url = `https://api.giphy.com/v1/gifs/${item.index}?api_key=p24Rm8ezd1sxNfBllt0FPQwzxBkMl6la`;
    }
    else
    {
        url = `https://api.giphy.com/v1/stickers/${item.index}?api_key=p24Rm8ezd1sxNfBllt0FPQwzxBkMl6la`;
    }
    SearchByUrl(url, isFirst, CallbackForItem);
}

const maxItemsCount = 25;
let itemsCount;
let itemArray;


function AddElements()
{
    if(itemsCount < itemArray.length)
    {
        itemsToAdd = 0;
        itemsAdded = 0;
        itemsArray = [];
        for(let i = 0; i < maxItemsCount; i++)
        {
            if(i + itemsCount >= itemArray.length)
            {
                itemsCount += maxItemsCount;
                break;
            }
            itemsToAdd++;
            RequestForItem(itemArray[i + itemsCount]);
        }
        itemsCount += maxItemsCount;
    }
}

function GetFavourites()
{
    if(isConnectedToDB)
    {
        DeleteButtonBar();
        ClearDropdown();
        itemsCount = 0;
        imageCounter = 0;
        itemArray = [];
        isFirst = true;
        var objectStore = GetTransaction();
        var request = objectStore.getAll();
        request.onsuccess = function(event)
        {
            itemArray = event.target.result;
            AddElements();
        }
    }
}

function SaveItem(ind)
{
    if(isConnectedToDB)
    {
        var objectStore = GetTransaction();
        let type = '';
        isGifSearching ? type = 'gif' : type = 'sticker';

        var request = objectStore.add({index: ind, type: type}, ind);
        request.onsuccess = function(event) {
            console.log("Succes");
        }
        request.onerror = (event) =>
        {
            alert("Item already in your favourites");
        }
        document.querySelector('#SearchStr').focus();
    }
}

function CreateSaveButton(id)
{
    return `<div class="SaveButton" onclick="SaveItem('${id}')">Save</div>`
}


let imageCounter;
const maxCountPerRow = 5;

function MakeSingleItemForTable(item)
{
    let str = '';
    if(imageCounter === 0) str += '<tr>\n';
    str += `<td class='GifCell'>${item}</td>\n`;
    if(++imageCounter === maxCountPerRow)
    {
        str += '</tr>\n';
        imageCounter = 0;
    }
    return str;
}

function MakeSingleImage(item)
{
    let saveButton = '';
    if(contentType == 'new')
    {
        saveButton = CreateSaveButton(item.id);
    }
    return `${saveButton}<img src='${item.images.fixed_width.url}' alt='${item.title}' />`;
}

function CreateTableRowsString(imagesArray)
{
    let str = '';
    for (let i = 0; i < imagesArray.length; i++)
    {
        let image = MakeSingleImage(imagesArray[i]);
        str += MakeSingleItemForTable(image)
    }
    itemNumber += imagesArray.length;
    return str;
}

function AddDataToTable(str, isNewSearch)
{
    let table = document.getElementById('GiphyContent');
    if(isNewSearch)
    {
        table.innerHTML = str;
    }
    else
    {
        table.innerHTML += str;
    }
}

var RequestForArray = (response, isNewSearch) =>
{
    let str = CreateTableRowsString(response);
    AddDataToTable(str, isNewSearch);
}

function SearchByUrl(url, isNewSearch, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
        {
            let response =  JSON.parse(xmlHttp.responseText).data;
            callback(response, isNewSearch);
            inProgress = false;
        }
    }
    xmlHttp.open("GET", url, true); // true for asynchronous 
    xmlHttp.send(null);
}

function MakeSearchString(str)
{
    let strArray = str.split(' ');
    let searchStr = '';
    if(Array.isArray(strArray))
    {
        for(let i = 0; i < strArray.length; i++)
        {
            searchStr += strArray[i];
            if((i + 1) !== strArray.length) searchStr += '+';
        }
    }
    return searchStr;
}

let url = '';

function DeleteButtonBar()
{
    document.getElementById('ButtonBar').innerHTML = null;
}

function SetButtonBar()
{
    document.getElementById('ButtonBar').innerHTML = 
        '<input onclick="ToggleToGif()" class="MenuButton" type="submit" value="GIFs">\n \
        <input onclick="ToggleToStickers()" class="MenuButton" type="submit" value="Stickers">';
}

function GetUrl()
{
    let search = document.querySelector('#SearchStr').value;
    search = MakeSearchString(search);
    let url = '';
    if(isGifSearching)
    {
        url = `https://api.giphy.com/v1/gifs/search?api_key=p24Rm8ezd1sxNfBllt0FPQwzxBkMl6la&q=${search}`;
    }
    else
    {
        url = `https://api.giphy.com/v1/stickers/search?api_key=p24Rm8ezd1sxNfBllt0FPQwzxBkMl6la&q=${search}`;
    }
    return url;
}

function ClearDropdown()
{
    let dropdown = document.getElementById('DropdownContent');
    dropdown.innerHTML = null;
    dropdown.style.display = 'none';
}

function Search()
{
    ClearDropdown();
    SetButtonBar();
    itemNumber = 0;
    imageCounter = 0;
    contentType = 'new';
    url = GetUrl()
    SearchByUrl(url, true, RequestForArray);
}