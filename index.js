// L'URL de base pour les requêtes vers l'API Hacker News.
const baseUrl = 'https://hacker-news.firebaseio.com/v0/';

// Variables pour suivre la page, la section actuelle et le plus grand identifiant d'élément.
let currentPage = 1;
let currentSection = 'newstories';
let maxItem = 0;

// Fonction throttle pour éviter les appels trop fréquents de certaines actions.
const throttle = (f, delay, { leading = false, trailing = false } = {}) => {
    let flag = false
    return (...args) => {
        if (!flag) {
            if (leading) f(...args)
            flag = true
            setTimeout(() => {
                flag = false
                if (trailing && !(leading)) f(...args)
            }, delay)
        }
    }
}

// Identifiants des histoires pour la page en cours.
let pageStoryIds = [];

// Fonction asynchrone pour récupérer les données depuis l'API Hacker News.
const fetchData = async () => {
    // Gestion de l'affichage des boutons en fonction de la section.
    document.getElementById('showMore').style.display = '';
    document.getElementById('getLastUpdates').style.display = '';
    let flag = 0;
    if (currentSection === 'polls') {
        flag = 1; 
        document.getElementById('showMore').style.display = 'none';
        document.getElementById('getLastUpdates').style.display = 'none';
    }

    // Requête pour obtenir les identifiants des histoires, emplois ou sondages.
    fetch(`${baseUrl}${currentSection}.json`)
        .then(response => response.json())
        .then(storyIds => {
            maxItem = storyIds[0];
            const startIndex = (currentPage - 1) * 10;
            const endIndex = currentPage * 10;

            // Filtrage des identifiants en fonction de la page en cours et de la section.
            if (flag === 0) {
                pageStoryIds = storyIds.slice(startIndex, endIndex);
            } else {
                // Pour les sondages, on a des identifiants prédéfinis.
                pageStoryIds = [160704, 126809];
            }

            // Récupération des détails de chaque histoire, emploi ou sondage.
            const itemPromises = pageStoryIds.map(itemId =>
                fetch(`${baseUrl}item/${itemId}.json`).then(response => response.json())
            );

            // Attente de la résolution de toutes les promesses.
            return Promise.all(itemPromises);
        })
        .then(items => {
            // Filtrage des éléments par type.
            const stories = items.filter(item => item.type === 'story');
            const jobs = items.filter(item => item.type === 'job');
            const polls = items.filter(item => item.type === 'poll');

            // Création d'une section pour afficher les éléments.
            const section = document.createElement('section');
            section.id = 'section';

            // Affichage des histoires, emplois et sondages sur la page.
            stories.forEach(async story => {
                section.appendChild(await displayPost(story));
            });

            jobs.forEach(async job => {
                section.appendChild(await displayPost(job));
            });

            polls.forEach(async poll => {
                section.appendChild(await displayPost(poll));
            });

            document.body.appendChild(section);
        })
        .catch(error => {
            console.error('Erreur :', error);
        });
}

// Fonction throttle pour charger plus de données lors du défilement.
const loadMoreData = throttle(async () => {
    currentPage++;
    await fetchData();
}, 200, { trailing: true });

// Fonction throttle pour rafraîchir la page toutes les 5 secondes.
const refreshData = throttle(async () => {
    currentPage = 1;
    location.reload();
}, 5000, { leading: true, trailing: false });

// Fonction throttle pour charger plus de données avec un bouton toutes les 5 secondes.
const loadMoreBtn = throttle(async () => {
    currentPage++;
    await fetchData();
}, 5000, { leading: true, trailing: false });

// Écouteur de défilement pour charger plus de données lorsque l'utilisateur atteint le bas de la page.
window.addEventListener('scroll', () => {
    if (currentSection !== 'polls') {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        if (scrollTop + clientHeight >= scrollHeight - 5) {
            currentPage++;
            loadMoreData();
        }
    }
});

// Écouteur pour le changement de section.
const sectionBtn = document.getElementById('sectionBtn');
sectionBtn.addEventListener('change', async (e) => {
    currentSection = sectionBtn.value;
    currentPage = 1;

    // Nettoyage de la page avant de charger de nouvelles données.
    let section = document.querySelectorAll('#section');
    section.forEach(element => {
        element.remove();
    });

    await fetchData();
});

// Écouteur pour afficher plus de contenu.
const showMore = document.getElementById('showMore');
showMore.addEventListener('click', () => {
    if (currentSection !== 'polls') {
        currentPage++;
        loadMoreBtn();
    }
});

// Fonction pour suivre les mises à jour dans la section actuelle.
function originUpdatesTracker() {
    let btn = document.getElementById('getLastUpdates');

    // Bouton pour rafraîchir manuellement les données.
    btn.addEventListener('click', () => {
        refreshData();
    });
    
    // Interval pour vérifier les mises à jour toutes les 5 secondes.
    setInterval(() => {
        fetch(`${baseUrl}${currentSection}.json`)
        .then(resp => resp.json())
        .then(v => {
            // Recherche de l'index du dernier élément dans la liste actuelle.
            let inbetween = v.indexOf(maxItem);
            
            if (inbetween > 0) {
                console.log('Mise à jour détectée');
                btn.innerHTML = `${inbetween} posts en attente`;
            }
        });
    }, 5000);
}



// Cette fonction crée un nouvel élément <span> avec du texte et des classes spécifiés.
function newSpan(str, ...cl) {
    // Création d'un nouvel élément <span>.
    let spanElement = document.createElement("span");

    // Ajout des classes spécifiées à l'élément <span>.
    cl.forEach((className) => spanElement.classList.add(className));

    // Ajout du texte spécifié à l'intérieur de l'élément <span>, suivi d'un saut de ligne.
    spanElement.innerHTML = str + '<br>';

    // Renvoie l'élément <span> nouvellement créé.
    return spanElement;
}

/**
 * Fetches the time difference between the current time and a given timestamp.
 * @param {number} element - The timestamp to calculate the time difference from.
 * @returns {string} - The formatted time difference string.
 */
// Fonction pour calculer le temps écoulé depuis la publication d'un post.
const fetchTime = (element) => {
    // Récupération du temps actuel en secondes.
    const currentTime = Math.floor(Date.now() / 1000);
    // Calcul de la différence entre le temps actuel et le temps du post.
    const postTime = currentTime - element;

    let timeString;
    // Logique de formatage du temps écoulé.
    if (postTime < 60) {
        timeString = `${postTime} secondes ago`;
    } else if (postTime < 3600) {
        const minutes = Math.floor(postTime / 60);
        timeString = `${minutes} minutes ago`;
    } else if (postTime < 86400) {
        const hours = Math.floor(postTime / 3600);
        timeString = `${hours} heures ago`;
    } else {
        const days = Math.floor(postTime / 86400);
        timeString = `${days} jours ago`;
    }
    return timeString;
}

// Fonction asynchrone pour récupérer des données depuis une URL.
async function data(str) {
    // Attente de la réponse à la requête fetch et conversion en JSON.
    let response = await fetch(str);
    return await response.json();
}

// Classe représentant un post sur Hacker News.
class Post {
    constructor(post) {
        // Initialisation des propriétés du post à partir des données fournies.
        this.id = post.id;
        this.author = post.by;
        this.time = post.time;
        this.title = post.title;
        this.type = post.type;
        this.text = post.text;
        this.url = post.url;
        this.tabs_Kids = post.kids;
        this.tabs_Comment = [];
        this.score = `scores : ${post.score}`;
    }

    // Méthode pour récupérer les commentaires associés au post.
    fetch_Post_Kids() {
        // Création d'un tableau de promesses pour chaque commentaire.
        const fetchPromises = this.tabs_Kids.map(async (element) => {
            // Création d'un objet Comment pour chaque commentaire.
            let comment = new Comment(await data(baseUrl + `item/${element}.json`));
            this.tabs_Comment.push(comment);
        });
        return Promise.all(fetchPromises);
    }

    // Méthode pour générer la représentation HTML du post.
    html() {
        // Création d'un élément <div> pour le post.
        let post = document.createElement("div");
        post.id = this.id;
        post.classList.add("post");
        
        // Création d'un élément <p> pour afficher l'auteur du post.
        let author = document.createElement("p");
        author.textContent = `by ${this.author}`;
        author.classList.add('by');

        // Condition pour vérifier s'il y a une URL associée au post.
        if (this.url) {
            // Création d'un élément <a> pour le titre du post avec un lien.
            let href = document.createElement("a");
            href.href = this.url;
            href.target = '_blank';
            href.classList.add('postTitle');
            // Ajout d'un saut de ligne avant le titre.
            let br = document.createElement('br');
            post.appendChild(br);
            // Ajout du titre comme enfant de l'élément <a>.
            if (this.title) href.appendChild(newSpan(this.title));
            // Ajout de l'élément <a> comme enfant du post.
            post.appendChild(href);
        } else {
            // Si pas d'URL, simplement ajouter le titre au post.
            if (this.title) post.appendChild(newSpan(this.title));
        }

        // Ajout de l'élément <p> avec l'auteur au post.
        post.appendChild(author);
        // Ajout du score comme un élément <span> au post.
        post.appendChild(newSpan(this.score, "score"));

        // Si le post a du texte, l'ajouter comme un élément <span> au post.
        if (this.text) post.appendChild(newSpan(this.text, "text"));

        // Création d'un élément <div> pour les commentaires associés au post.
        let divComment = document.createElement("div");
        // Création d'un élément <span> pour afficher le nombre de commentaires.
        let nbcomment = newSpan(this.tabs_Kids ? `Comment (${this.tabs_Kids.length}):` : `Comment (0): <br>`);
        divComment.appendChild(nbcomment);

        // Si des commentaires sont présents, les récupérer et les afficher.
        if (typeof this.tabs_Kids !== 'undefined') {
            // Attente de la résolution de toutes les promesses de récupération des commentaires.
            Promise.all([this.fetch_Post_Kids()]).then(() => {
                this.tabs_Comment.forEach((element) => {
                    divComment.appendChild(element.html());
                });
            });
        }

        // Ajout d'un événement pour afficher ou masquer les commentaires.
        nbcomment.addEventListener("click", () => {
            console.log(divComment);
            for (let child of divComment.children) {
                if (divComment.firstChild != child) {
                    child.style.display == "" ? child.style.display = "none" : child.style.display = "";
                }
            }
        });

        // Création d'un élément <div> pour afficher le temps depuis la publication.
        let time = document.createElement("div");
        time.classList.add("time");
        time.appendChild(newSpan(`${fetchTime(this.time)}`));
        // Ajout de tous les éléments créés au post.
        post.appendChild(time);
        post.appendChild(divComment);

        // Renvoie l'élément <div> représentant le post.
        return post;
    }
}

// Classe représentant un commentaire sur Hacker News.
class Comment {
    constructor(comment) {
        // Initialisation des propriétés du commentaire à partir des données fournies.
        this.id = comment.id;
        this.author = comment.by;
        this.time = comment.time;
        this.text = comment.text;
        this.tabs_Kids = comment.kids;
        this.death = comment.dead;
        this.tabs_Comment = [];
    }

    // Méthode pour récupérer les commentaires associés au commentaire.
    fetch_Comment_Kids() {
        // Création d'un tableau de promesses pour chaque commentaire.
        const fetchPromises = this.tabs_Kids.map(async element => {
            // Création d'un objet Comment pour chaque commentaire.
            let comment = new Comment(await data(baseUrl + `item/${element}.json`))
            this.tabs_Comment.push(comment)
        });
        return Promise.all(fetchPromises)
    }

    // Méthode pour générer la représentation HTML du commentaire.
    html() {
        // Création d'un élément <div> pour le commentaire.
        let comment = document.createElement("div");
        comment.id = this.id;
        comment.classList.add("comment");
        // Initialisation du style pour masquer le commentaire par défaut.
        comment.style.display = "none";

        // Création d'un élément <p> pour afficher l'auteur du commentaire.
        let author = document.createElement("p");
        author.id = "by";
        author.appendChild(newSpan(`${this.author} :`, "author"));
        // Ajout de l'élément <p> comme enfant du commentaire.
        comment.appendChild(author);

        // Si le commentaire a du texte, l'ajouter comme un élément <span> au commentaire.
        if (this.text) comment.appendChild(newSpan(`${this.text} <br><br>`, "text"));

        // Ajout d'un élément "delete" pour indiquer si le commentaire a été supprimé.
        if (this.death) comment.appendChild(newSpan("delete", "delete"));

        // Si des commentaires sont présents, les récupérer et les afficher.
        if (this.death) comment.classList.add("delete");

        // Création d'un élément <div> pour les commentaires associés au commentaire.
        let divComment = document.createElement("div");
        // Création d'un élément <span> pour afficher le nombre de commentaires.
        let nbcomment = newSpan(this.tabs_Kids ? `Comment (${this.tabs_Kids.length}):` : `Comment (0):`);
        divComment.appendChild(nbcomment);

        // Si des commentaires sont présents, les récupérer et les afficher.
        if (typeof this.tabs_Kids !== 'undefined') {
            // Attente de la résolution de toutes les promesses de récupération des commentaires.
            Promise.all([this.fetch_Comment_Kids()]).then(() => {
                this.tabs_Comment.forEach(element => {
                    divComment.appendChild(element.html())
                });
            });
        }

        // Ajout d'un événement pour afficher ou masquer les commentaires.
        nbcomment.addEventListener("click", () => {
            console.log(divComment);
            for (let child of divComment.children) {
                if (divComment.firstChild != child) {
                    child.style.display == "" ? child.style.display = "none" : child.style.display = "";
                }
            }
        });

        // Création d'un élément <div> pour afficher le temps depuis la publication.
        let time = document.createElement("div");
        time.classList.add("time");
        time.appendChild(newSpan(`${fetchTime(this.time)}`));
        // Ajout de tous les éléments créés au commentaire.
        comment.appendChild(time);
        comment.appendChild(divComment);

        // Renvoie l'élément <div> représentant le commentaire.
        return comment;
    }
}

// Fonction asynchrone pour afficher un post sur la page.
async function displayPost(postData) {
    let post = new Post(postData);    
    return post.html();
}



fetchData();// Fetch data initially

originUpdatesTracker();// Checks for new posts since last fetch