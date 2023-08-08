import VerticalLayout from './VerticalLayout.js'

export default () => {

  return (/*html*/`
    <div class='layout'>
      ${VerticalLayout()}
      <div class='content' id='loading'>
        Loading...
      </div>
    </div>`
  )
}