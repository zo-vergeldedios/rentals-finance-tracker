App:
Expense, income and net profit tracker for Airbnb Business

Features:

1. User login/authentication (email and password)
2. Input expense/income and set date/category for each log.
3. Dashboard:
   3.a Monthly net profit (Bar graph)
   3.b Monthly expense (Pie chart)
   3.c Monthly income (Pie chart)
   3.d Average monthly net profit
   3.e Average monthly expense
   4.f Average monthly income

User flow:

1. User creates account.
   1.a User registers a username and password.
   1.a.a User will get an error when the username that they used is taken.
   1.b User will be automatically logged in if the username and password is successfylly registered.

2. User logs in.
   2.a User will be greeted by the dashboard.
   2.b There is a navigation on the left side for the dashboard and the expense and income page. (navigation will be on top of the page on mobile view)

3. User inputs a log
   3.a User goes to the income and expense page.
   3.b User inputs an expense/income, and sets the category for the expense. Date defaults to now but it can be changed.
   3.c User saves the expense/income log by clicking the save button.
   3.d Expense and income will be saved on the current month.
   3.e User can change the month to see the saved expense/income on each month.

Technologies Used:
Typescript with Express.js and React.js
PostgreSQL and Railway
