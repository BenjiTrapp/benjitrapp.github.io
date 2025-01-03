---
layout: culture
title: A song of entropy and toil
---

## Prologue - or what is entropy?

An unofficial appendix of the main laws of thermodynamics reads: `Thou shalt not make unto thee any image of entropy`. We are now going to violate this principle - what is entropy?

Entropy is primarily a made-up word and comes from the ancient Greek ἐντροπία entropía. This can be roughly translated as "in turn". Entropy describes a fundamental thermodynamic state and is described by the second law of thermodynamics:

> The total entropy in an isolated system can never become smaller, i.e. it can only become larger or remain the same. A system can no longer change when the entropy has reached its maximum value, the system is then in equilibrium.

Mathematically, this can be described as a rule of thumb by `∆S = Q/T` - where Q represents the amount of heat in a reversible process and T stands for the temperature. In concrete terms, the equation indicates that, if a certain number of joules of heat energy (Q) is transferred into or out of a system at constant temperature (i.e. the transfer does not result in a temperature change to the system), then all of the heat exchanged must have gone to change the entropy of the system (S). The rationale for this assertion s as follows:

1. Temperature is a measure of the average thermal energy of the atoms and molecules in a system - that is, the energy stored as kinetic and potential energy in molecular translational, rotational and vibrational motions.
2. If adding energy to a system by applying heat does not cause an increase in temperature, then this energy cannot have gone to increase the energy stored in these molecular motions. (Vice versa for the case where heat energy is removed.)

So where did the added energy go, if not to increasing the dynamic motions of the atoms and molecules of the system? It has instead gone to increase the entropy of the system - that is, to increasing the number of configurational microstates occupied by the atoms of the system.

A good example of this behavior is provided by a phase transition, such as the melting of ice. If a glass of ice-water is left in a warm room, it will gradually absorb heat from the room leading the ice to slowly melt. A thermometer measuring the temperature of the ice-water will not record an increase in temperature during this process; under standard conditions, the temperature will remain at 0 °C as long as there is at least some ice left. The heat that is absorbed from the room goes to achieve the release of water molecules from the ice crystal, allowing them to move more freely as liquid water. The average thermal energy of the water molecules in ice at 0 °C or in water at 0 °C is identical, but in the solid state this energy is manifested as vibrational motions of atoms, whereas in liquid water the energy is stored in a combination of bond vibrations and molecular translations, rotations and liberations. The liquid water has much more entropy, however, and thus represents a higher energy state of the system. The process of melting has thus involved a transfer of heat from the surroundings (the room) to the system (the ice water) without changing the temperature of the system. All of the energy transferred to the system as heat has gone directly to increase the entropy of the system.

<br><br>
<p align="centre">
<img width=600 src="/images/entropy-and-toil.png">
</p>

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Aha! There is no Agile Transformation. It is just a constant fight against entropy that keeps organizations away from functioning optimal. And a mean to do that most efficiently is the Improvement Kata. <a href="https://twitter.com/RealMikeRother?ref_src=twsrc%5Etfw">@RealMikeRother</a> <a href="https://twitter.com/jonsmart?ref_src=twsrc%5Etfw">@jonsmart</a></p>&mdash; Lars (@bob5ec) <a href="https://twitter.com/bob5ec/status/1537897257613217793?ref_src=twsrc%5Etfw">June 17, 2022</a></blockquote>

Based on this thesis, an organization can be viewed as an isolated system. The system as such is slowed down by various factors like:

* Constant change (everyone wants change - but no one wants to change themselves).
* Communication - the more interdependencies there are between the components, the more sluggish the system becomes (boards, committees, inter-team and intra-team communication, ...)
* Process jungle and rigid traditions
* History - from legacy system to historical roles and artifacts
* much more ...

However, most of the points that affect the entropy of the system here have a different cause. Google expresses this on their SRE (Site Reliability Engineering) website by the term toil:

> "So what is toil? Toil is the kind of work tied to running a production service that tends to be manual, repetitive, automatable, tactical, devoid of enduring value, and that scales linearly as a service grows. Not every task deemed toil has all these attributes, but the more closely work matches one or more of the following descriptions, the more likely it is to be toil:"
* [Google](https://landing.google.com/sre/sre-book/chapters/eliminating-toil/)

Automation is the antidote to toil - automating low-value work leaves more time for higher-value work. Automation should also improve repeatability and reliability by automating all tasks. When the same tasks are done the same way every time, there are no more surprises. Manual tasks, on the other hand, lead to a high degree of variation and thus a lack of repeatability.

## DevOps culture as the answer

<p align="centre">
<img width=600 src="https://user-images.githubusercontent.com/8672357/175659600-b6771a3f-76ea-4baa-9718-e5a9175e79c8.png">
</p>

John Willis and Damon Edwards developed the acronym [CAMS](https://itrevolution.com/devops-culture-part-1/) in 2010, where the `A` stands for automation and, as we have already learned, provides a good answer to Toil - but how do you defeat entropy? Jez Humble provides an idea with the extension of the acronym to [C.A.L.M.S](https://benjitrapp.github.io/cultures/2022-03-30-CALMS-devops/). What does the `L` mean?

## `L` stands for Lean

Jez Humble's extension here adds another success factor to the fight against entropy. Lean consists of the [five key principles of Lean](https://theleanway.net/The-Five-Principles-of-Lean). The Lean IT movement seeks to extend these concepts to the world of software development. The most important texts are [Lean Software Development by Tom & Mary Poppendieck]([https://www.amazon.co.uk/Lean-Software-Development-Agile-Toolkit/dp/0321150783](https://www.oreilly.com/library/view/lean-software-development/0321150783/)) and [Lean Enterprise by Humble, Molesky and O'Reilly](https://www.oreilly.com/library/view/lean-enterprise/9781491946527/). Lean aims at FLOW - the smooth transition of work from one "work centre" to the next in the shortest possible time. Ideally with as few queues/buffers as possible - most of the organizations fail here.

## `M` for measuring toil to derive entropy

Once you’ve identified the work being done, how do you determine if it’s too much? It’s pretty simple: Regularly (monthly or quarterly is a good interval), Google computes an estimate of how much time is being spent on various types of work. Look for patterns or trends tickets, surveys, and on-call incident response, and prioritize based on the aggregate human time spent. The  Google SRE handbook aims to keep toil below 50% of each SRE’s time, to preserve the other 50% for engineering project work. If the estimates show the 50% toil threshold is exceeded, **Google plans work explicitly with the goal of reducing that number and getting the work balanced back into a healthy state**.

If we think back to the entropy definition - this exactly describes entropy and the attempt to reduce entropy to speed up the system. By making it measurable we have now an option to make entropy visible within a organization as an isolated system.

## The Duct Tape Engineers of Westeros

Let's come back to the Automation aspect and the entropy connected to it. Most engineers are tending that they need to do their changes fast and don't have the time for testing or even refactoring. In the end they end up with a sloppy written mono-class that is very tight coupled and highly violates the `Separation of Concerns` and the `Single responsibility` aspect of [SOLID](https://github.com/BenjiTrapp/SOLID-Coding-Dojo). If the Product Owner once changes the mind again and/or one or multiple bugs got detected, we are adding each time another layer of duct tape on top of it.

But why is being a duct tape engineer so glorified? One big aspect is getting the burden and the pressure connected to it away. Like in old 80es TV series a Duct Tape Engineer mutates to a mixture of MacGuyver and the A-Team - hastily rushing into mixing up Duct Tape with scrap metal parts and tinkering a post apocalyptic looking armed vehicle to defeat the issue in his way. Troubleshoot and fixing issues like a hero get's glorified by the management and forster this behavior.

<p align="centre">
<img width=400 src="/images/safety-car.gif">
</p>

But wait - what happens after the show ends? The glued together parts are falling apart, the scrap parts are getting rusty and the vehicle is suffering from corrosion. Our software will act the same and in total slow us out. Working like this will produce toil and entropy on a very large scale on multiple layers:

* The software becomes unmaintainable
* A high increase of KPIs like "Change-Failure-Rate" or outage related KPIs like "Mean-Time-Between-Failure" connected with a very low "Mean-Time-To-Repair" should be a warning signal
* Crappy built software has also impact on the health of the development team - it literally makes them sick
* The overall reliability can be hit even across the team boundaries and result in a non-resilient overall software product
* Architecture will suffer by a constant erosion and derives from the reality of the code
* Reduce the efficiency of agility or even crash it
* Today's bug is tomorrows security incident (if things turn out very bad). Quality first, Security second!

This will in total increase the entropy and toil hidden in the background. Who likes to talk about bad crafted things? Who constantly want to make technical dept visible - and get's the Ok to remove it?

### What are valid ways to get out of this?

First at all - you have to change aspects in your team setup. Reduce the workload, postpone other activities and spend some time to refactor it. Some slack-time to [train "Red-Green-Refactoring"](https://github.com/BenjiTrapp/TDD-Coding-Dojo) cycles will speed you even more up and is time spent for something good and valuable.

So how we can achieve this?
<p align="centre">
<img src="/images/refactoring.png">
</p>

1. Practice the [Boyscout rule](https://biratkirat.medium.com/step-8-the-boy-scout-rule-robert-c-martin-uncle-bob-9ac839778385) - "Always leave the code you're editing a little better then you found it" - Robert C. Martin (Uncle Bob)
2. Constant refactor your code and ask in Retrospectives if someone kept ignoring it, and what were the reasons. Tackle this by transparency and in a collaborative manner as a team
3. Price in refactoring in your regular estimations for user stories. There is no excuse in not doing the refactoring!

Is this enough? In short NO - we didn't even tackle the root cause of this: `The glorification of Duct Tape Engineering by the Management`. If we can't make this visible to the management and get a real buy in, nothing will change and end up in the establishment of a cargo cult and the system will become unmaintainable. Since entropy is also a KPI for the inner stability of a system, this describes perfectly an instable (chaotic) system.
