// Create a global Audio object to control music playback
let currentSong = new Audio();
let songs;
let currfolder;
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00"
    }
}
// Get reference to the play/pause button from the DOM
const playBtn = document.getElementById("play");

/**
 * Utility: Format seconds as MM:SS
 */
function formatTime(seconds) {
    let min = Math.floor(seconds / 60);
    let sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Fetch the list of songs from the server directory
 */
async function getsongs(folder) {
    currfolder = folder;
    let a = await fetch(`http://127.0.0.1:5500/${folder}/`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");
    songs = [];

    for (let i = 0; i < as.length; i++) {
        const ele = as[i];
        if (ele.href.endsWith(".mp3")) {
            songs.push(ele.href.split(`/${folder}/`)[1]);
        }
    }
    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0];
    songUL.innerHTML = ""
    // Populate the song list in the sidebar
    for (const song of songs) {
        songUL.innerHTML += `
            <li>
                <img src="https://www.citypng.com/public/uploads/preview/apple-itunes-music-round-black-icon-hd-png-701751694974718ttchlw1rjn.png">
                <div class="info">
                    <div>${decodeURIComponent(song)}</div>
                    <div>Saptarshi</div>
                </div>
                <div class="playnow">
                    <span>Playnow</span>
                    <img src="https://www.friidesigns.com/wp-content/uploads/2018/11/white-play-icon-png-6.png">
                </div>
            </li>`;
    }

    // Add click handler to each song
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            const songName = e.querySelector(".info").firstElementChild.innerHTML.trim();
            playMusic(songName);

            playBtn.classList.remove("fa-play");
            playBtn.classList.add("fa-pause");
        });
    });
    return songs;
}

/**
 * Load and play a selected song
 */
const playMusic = (track, pause = false) => {
    currentSong.src = `/${currfolder}/` + track;
    if (!pause) {
        currentSong.play();
    }

    // Display the actual song name
    let a = document.querySelector(".songinfo").innerHTML = decodeURIComponent(track);

    // Display the duration once it's loaded
    currentSong.addEventListener("timeupdate", () => {
        let current = formatTime(currentSong.currentTime);
        let duration = formatTime(currentSong.duration);
        document.querySelector(".songtime").innerHTML = `${current} / ${duration}`;
        // Move the circle
        let percentage = (currentSong.currentTime / currentSong.duration) * 100;
        document.querySelector(".circle").style.left = `${percentage}%`;

        //To allow the user to click on the seekbar to seek to a position:

        document.querySelector(".seekbar").addEventListener("click", (e) => {
            let seekbar = e.currentTarget;
            let rect = seekbar.getBoundingClientRect();
            let offsetX = e.clientX - rect.left;
            let percentage = offsetX / rect.width;
            currentSong.currentTime = percentage * currentSong.duration;
        });
    });

};

async function displayAlbums() {
    let a = await fetch(`http://127.0.0.1:5500/songs/`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let anchors = div.getElementsByTagName("a");
    let card_container = document.querySelector(".card_container");
    card_container.innerHTML = "";

    for (let e of anchors) {
        if (e.href.includes("/songs/") && e.href !== "http://127.0.0.1:5500/songs/") {
            let url = new URL(e.href);
            let folder = url.pathname.split("/").filter(Boolean).pop();

            try {
                let metaResponse = await fetch(`/songs/${folder}/info.json`);
                if (!metaResponse.ok) throw new Error("info.json not found");
                let meta = await metaResponse.json();

                // Create a div element manually so we can bind events
                let card = document.createElement("div");
                card.className = "card";
                card.dataset.folder = folder;
                card.innerHTML = `
                    <div class="play">
                        <i class="fa-solid fa-play"></i>
                    </div>
                    <img src="/songs/${folder}/cover.JPEG" class="img">
                    <h2>${meta.title}</h2>
                    <p>${meta.description}</p>
                `;

                // Add click event to load songs from the selected folder
                card.addEventListener("click", async () => {
                    songs = await getsongs(`songs/${folder}`);
                    // Removed autoplay here
                });

                card_container.appendChild(card);
            } catch (err) {
                console.error(`Failed to load info.json for ${folder}:`, err);
            }
        }
    }
}




//  Main logic to initialize the music player
async function main() {
    songs = await getsongs("songs/ncs");
    playMusic(songs[0], true);

    //display all the albums on the page
    displayAlbums()

    // Play/Pause button toggle
    playBtn.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            playBtn.classList.remove("fa-play");
            playBtn.classList.add("fa-pause");
        } else {
            currentSong.pause();
            playBtn.classList.remove("fa-pause");
            playBtn.classList.add("fa-play");
        }
    });

    // Reset play icon when song ends
    currentSong.addEventListener("ended", () => {
        playBtn.classList.remove("fa-pause");
        playBtn.classList.add("fa-play");
    });

    // Update current time display as song plays
    currentSong.addEventListener("timeupdate", () => {
        let current = formatTime(currentSong.currentTime);
        let duration = formatTime(currentSong.duration);
        document.querySelector(".songtime").innerHTML = `${current} / ${duration}`;
    });

    //add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    })

    //add event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    })

    //previous and next button
    previous.addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
    })

    next.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }
    })

    //add an event listener for volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100
    })

    //load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`);
            playMusic(songs[0])

        })
    })
    // Live search to filter visible songs
    document.querySelector(".search-bar input").addEventListener("input", (e) => {
        let query = e.target.value.toLowerCase();
        document.querySelectorAll(".songlist li").forEach((li) => {
            let songName = li.querySelector(".info div").textContent.toLowerCase();
            li.style.display = songName.includes(query) ? "flex" : "none";
        });
    });
}

main();

