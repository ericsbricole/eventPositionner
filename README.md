# eventPositionner

eventPositionner est une page web toujours en développement intégrant une mappemonde 2D interactive réalisée en JavaScript avec la librairie d3.js.
Cette application est accessible à l'adresse suivante: http://ericsbricole.github.io/eventPositionner/

Elle vous permet de visualiser sur la mappemonde la distribution de données ou d'évenements relatifs aux pays, en créant une légende automatique séparant les pays en 4 groupes égaux.
Vous pouvez fournir pour cela un fichier de données au format .csv, répondant au format suivant:

nom des pays concerné par la donnée au format indiqué par la mappemonde en passant la souris, nom de la donnée A, nom de la donnée B
pays1,donnéeA1,donnéeB1
pays2,donnéeA2,donnéeB2

Si plusieurs types de données sont présents, comme sur l'exemple ci-dessus, l'interface détectera les type de données et vous demandera de cocher le bouton correspondant à la donnée à visualiser. Cliquer ensuite sur "Chargez les données".
Un fichier de donnée en exemple est téléchargeable sur l'application.
