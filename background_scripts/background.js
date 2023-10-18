const apiBTN = document.getElementById("insert")
const sortBTN = document.getElementById("btn")
const apiDIV = document.getElementById("API_TOKEN")
const tabCount = document.getElementById("tabCount")

sortBTN.addEventListener('click', sort)
apiBTN.addEventListener('click', addKEY)

let API_KEY = localStorage.getItem("key")
if (API_KEY != null && API_KEY != "null" && validKEY(API_KEY)) {
	console.log("API KEY FOUND")
	sortBTN.style.display = "block"
	apiDIV.style.display = "none"
} else {
	console.log("NO API KEY!")
	sortBTN.style.display = "none"
	apiDIV.style.display = "block"
}


async function addKEY(){
	const textbox = document.getElementById("api_key_field")
	console.log(textbox.value)
	const valid = await validKEY(textbox.value)

	if(valid) {
		localStorage.setItem("key", textbox.value)
		API_KEY = textbox.value
		sortBTN.style.display = "block"
		apiDIV.style.display = "none"
	}
	else console.log("INVALID!")
}

async function validKEY(key){
	const url = `https://www.googleapis.com/youtube/v3/videos?id=dQw4w9WgXcQ&part=contentDetails&key=${key}`
	const data = await fetch(url)
	return data.status == 200
}

async function fetchData(tabs) {
    const numRuns = Math.ceil(tabs.length / 50) 

    const items = []
    for(let i = 0; i < numRuns; i++){
        const start = i*50
        const stop = Math.min((i+1)*50, tabs.length)
        
        // numRuns were innaccurate
        if (start > stop) {
            break
        }
    
        // Actually fetching the timestamps 
        const currIDS = tabs.slice(start, stop)
        const url = `https://www.googleapis.com/youtube/v3/videos?id=${currIDS.toString()}&part=contentDetails&key=${API_KEY}`
        const result = await fetch(url).then((data) => data.json()).then((json) => json.items).catch((e) => {tabCount.innerText="BORKED"+e; return})
        
        // Adding to list
        items.push.apply(items, result)
    }

    return items
}

async function sort(){
  	console.log("SORTING...")
	let tabs = await browser.tabs.query({currentWindow:true,url: "https://www.youtube.com/watch?v=*"}).then(result => result)

	if(tabs.length==0) return // Stop.

	// Get all IDS
	let ids=[]
	for(const tab of tabs){
		ids.push(tab.url.substr(32,11)) // 32 Chars until video ID
	}

	// Fetch durations
    const items = await fetchData(ids)
	        
	// Append durations to tab list 
	for(let i = 0; i < items.length; i++){
		tabs[i].duration = parseDuration(items[i].contentDetails.duration)
	}

	// Sort and move tabs
	tabs.sort(compareDuration)
	browser.tabs.move(
		tabs.map((tab) => {return tab.id;}),
		{ index: 1}
	)

    tabCount.innerText = tabs.length
}

// Convert "PT18M6S" to 1086 (seconds) ISO-8601
// Pretty sure there are a bunch of edge cases not handled here
function parseDuration(charset){
	const numberPattern = /\d+/g;
	const nums = charset.match(numberPattern)

	return calculateDuration(nums, 1, nums.length)
}

// Calculate duration in seconds. Flexible between 1 and 3 digits in arr.
function calculateDuration(arr, count, total){
	if (count == total+1) return 0
	return arr[count-1] * Math.pow(60, total-count) + calculateDuration(arr, count+1, total)
}

function compareDuration(a,b){
	if (b.duration > a.duration) {
		return -1;
	} else if (b.duration < a.duration) {
		return 1;
	} else {
		return 0;
	}
}
