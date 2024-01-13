---
layout: default
---

<p align="center">
<img width="200" src="/images/ninja-attack.png">
<br>Invincibility lies in the defence; the possibility of victory in the attack - Sun Tzu
</p>
<br>
<br>

<div class="attacks">
  {% for attack in site.attacks %}
    <article class="attack">

      <h1><a href="{{ site.baseurl }}{{ attack.url }}">{{ attack.title }}</a></h1>

      <div class="entry">
        {{ attack.excerpt }}
      </div>

      <a href="{{ site.baseurl }}{{ attack.url }}" class="read-more">Read More</a>
    </article>
  {% endfor %}
</div>
