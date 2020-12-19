const socket = io()
//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")
const $sidebar = document.querySelector('#sidebar')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
//Options

const {username,room} = Qs.parse(location.search,{ ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on("message",(msg)=>{
    //console.log(msg)
    const html = Mustache.render(messageTemplate,{
        username:msg.username,
        message:msg.text,
        createdAt : moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(url)=>{
    const html = Mustache.render(locationTemplate,{
       username:url.username,
       url: url.text,
       createdAt : moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    
    $messageFormButton.setAttribute('disabled','disabled')

    //disable
    const message = e.target.elements.message.value

    //acknowledgement function
    socket.emit("sendMessage",message,(error)=>{

        //enable
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ""
        $messageFormInput.focus()

        if(error){
            return console.log(error)
        }
        console.log("The message was delivered!")
    })
})

socket.on('roomData',({room,users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users,
    })
    $sidebar.innerHTML = html
})

$locationButton.addEventListener('click',()=>{
    

    if (!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }
    //disable buttom
    $locationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((postion)=>{
        socket.emit('sendLocation',{
        "lattitude": postion.coords.latitude,
        "longitude": postion.coords.longitude
        },(error)=>{

            //acknowledgement
            if(error){
                return console.log(error)
            }
            //enable button
            $locationButton.removeAttribute('disabled')
            console.log("Location shared")
        })
        
    })
})


socket.emit("join",{ username, room},(error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})