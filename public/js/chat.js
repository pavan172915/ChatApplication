const socket = io()

const $messageForm = document.querySelector('#form-id')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#location')
const $messages = document.querySelector('#messages')
// TEMPLATES...
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessagTemplate = document.querySelector('#LocationMessage-template').innerHTML
const sidebarTemplate = document.querySelector('#siderbar-template').innerHTML
// OPTIONS
const { username,room} = Qs.parse(location.search,{ignoreQueryPrefix:true}) // question mark goes away
const autoScroll = ()=>{
    // New message element
    const $newMessage = $messages.lastElementChild

    // height of the new message
    const newMessageStyles = getComputedStyle($newMessage) // all availables styles applied for this property
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin // adding message height to the margin height to get total height

    //visible height
    const visibleHeight = $messages.offsetHeight

    //height of messages container
    const containerHeight = $messages.scrollHeight

    //how far i scorlled
    const scrollOffSet = $messages.scrollTop + visibleHeight // gives distance from top to current position

    if(containerHeight-newMessageHeight<=scrollOffSet){
        $messages.scrollTop = $messages.scrollHeight // scroll all the way to bottom
    }
}
socket.on("Message",(message)=>{
    //console.log(msg);
    const finalHtml = Mustache.render(messageTemplate,{
        username:message.username,
       message: message.text,
       createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',finalHtml)
    autoScroll()
})
socket.on('LocationMessage',(message)=>{
    //console.log(url)
    const finalHtml = Mustache.render(locationMessagTemplate,{
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend',finalHtml)
    autoScroll()
})

socket.on('roomData',({room,users})=>{
    const finalHtml = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = finalHtml
})
$messageForm.addEventListener('submit',(event)=>{
    event.preventDefault();
    //console.log('Message Sent!');
    //const msg = document.querySelector('input').value # this fails when form has multiple input fields
    //alternately
    $messageFormButton.setAttribute('disabled','disabled') // disables the form when we click submit button
    const msg = event.target.elements.msg.value
    socket.emit("SendMessage",msg,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('Message Delivered!!')
    });
})
$locationButton.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('Your browser do not support this feature')
    }
    $locationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        //console.log(position.coords.latitude)
        socket.emit('sendLocation',{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        },()=>{
            $locationButton.removeAttribute('disabled')
            console.log('Location Shared!!')
        })
    })
})
socket.emit('join',{
    username,room
},(error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})