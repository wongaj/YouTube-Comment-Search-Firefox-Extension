const youTubeGetRequestURL = "https://www.googleapis.com/youtube/v3/commentThreads";
const youTubeAPIKey = "*** API KEY ***";
const videoIdVariable = "v";
let sortBy = "time";
let videoId = "";
let searchQuery = "";
let maxResults = "10";

// Get current tab URL
browser.tabs.query({active:true,currentWindow:true}).then(function(tabs){
    let currentTabUrl = tabs[0].url;
    videoId = getYouTubeURLVariableValue(videoIdVariable, currentTabUrl);

    if(videoId.length) {
        document.getElementById('title').innerHTML = "YouTube Comment Search";
    } else {
        document.getElementById('title').innerHTML = "Not on a YouTube Video";
    }
});

// Hook button to search
window.onload = function() {
    document.getElementById("searchBtn").onclick = executeSearch.bind();
    document.getElementById("query").addEventListener("keyup", function(event) {
        event.preventDefault();

        //Search on "Enter" key press
        if (event.keyCode === 13) {
            // Trigger the button element with a click
            document.getElementById("searchBtn").click();
        }
    }); 
}

/*
    Returns query variable value in a URL location

    variable: string
    urlLocation: location

    returns string
*/
function getYouTubeURLVariableValue(variable, urlLocation){
    if(urlLocation.search("youtube.com/watch?") > 0){
        let query = urlLocation.split("?")[1];
        let vars = query.split('&');
        for (let i = 0; i < vars.length; i++) {
            let pair = vars[i].split('=');
            if (decodeURIComponent(pair[0]) === variable) {
                return decodeURIComponent(pair[1]);
            }
        }   
    } else {
        return "";
    }
}

/*
    Creates the API URL for getting YouTube comments

    baseUrl: string
    searchObject

    returns string
*/
function buildRequestURL() {
    searchQuery = document.getElementById('query').value;
    maxResults = document.getElementById('maxResults').value;
    sortBy = document.getElementById('time').checked ? "time" : "relevance";

    const searchObject = {
        key: youTubeAPIKey,
        maxResults: maxResults,
        searchTerms: searchQuery,
        order: sortBy,
        videoId: videoId
    };
    if(searchObject.videoId.length){
        let requestQuery = "?part=snippet%2Creplies";

        for(let key in searchObject) {
            requestQuery = requestQuery + "&" + key + "=" + encodeURIComponent(searchObject[key]);
        }

        return youTubeGetRequestURL + requestQuery;       
    } else {
        return "";
    }

}

/*
    Executes search and creates the comments
*/
function executeSearch() {
    document.getElementById('display').innerHTML = "loading...";
    const url = buildRequestURL();
    console.log(url)
    if (window.XMLHttpRequest && url.length) {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
          if (xhr.readyState == 4) {
            document.getElementById('display').innerHTML = makeCommentThread(JSON.parse(xhr.response));
          }
        }
        xhr.send();
    } else {
        document.getElementById('display').innerHTML = "You should watch a video on YouTube";
    }  
}

/*
    Creates comment thread given the JSON response

    reponse: commentThread Object

    returns string
*/
function makeCommentThread(response){
    const comments = [];
    const commentList = response.items;
    commentList.forEach(( comment ) => {
        const topLevelComment = comment.snippet.topLevelComment.snippet;
        comments.push(makeCommentHTML(topLevelComment, false));

        if(comment.replies) {
            comment.replies.comments.forEach((reply) => {
                const replyComment = reply.snippet;
                comments.push(makeCommentHTML(replyComment, true));
            });
        }
    });

    if(comments.length)
        return comments.join(" ");

    return "No Search Results";
}

/*
    Creates the HTML for a YouTube Comment

    comment: Comment Object
    reply: boolean

    returns string
*/
function makeCommentHTML(comment, reply){
    const commentText = decodeURIComponent(comment.textDisplay);
    const profileName = comment.authorDisplayName;
    const profileURL = comment.authorChannelUrl;
    const profilePic = comment.authorProfileImageUrl;
    const date = new Date(comment.publishedAt);
    const likeCount = comment.likeCount;
    const likeCountColor = parseInt(likeCount) >= 0 ? "positive" : "negative";
    const commentStyle = reply ? "reply" : "topLevelComment";

    return "<div class='" + commentStyle + "'>" +
                "<img src=" + profilePic + ">" +
                "<a href=" + profileURL + ">" + profileName + "</a>" +
                "<span class='stickRight " + likeCountColor + "'>" + likeCount + "</span>" +
                "<span class='stickRight'>" + date.toLocaleDateString() + "</span>" +
                "<div class='comment'>" + commentText + "</div>" +
            "</div>"
}